/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, test, vi } from "vitest";

import { isSucceededState } from "#management/common/workflow/types";
import { applyWebhookSubscriptions } from "#management/domains/webhooks/apply";
import { createWebhooksStepContext } from "#management/domains/webhooks/context";
import { planWebhookSubscriptions } from "#management/domains/webhooks/plan";
import {
  createInitialInstallationState,
  runInstallation,
  runValidation,
} from "#management/installation/runner";
import { configWithWebhooks } from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";
import { createMockExistingCommerceWebhook } from "#test/fixtures/webhooks";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

const COMMERCE_BASE_URL = "https://api.commerce.adobe.com/V1";

type ValidationNode = {
  path: string[];
  issues: Array<{ code: string }>;
  children: ValidationNode[];
};

function findValidationNodeByPath(
  step: ValidationNode,
  expectedPath: string[],
): ValidationNode | undefined {
  if (step.path.join(".") === expectedPath.join(".")) {
    return step;
  }

  for (const child of step.children) {
    const found = findValidationNodeByPath(child, expectedPath);
    if (found) {
      return found;
    }
  }
}

setupApiTestLifecycle();
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("webhooks installation integration", () => {
  test("runs the real webhooks branch and stores the resolved subscriptions", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const config = configWithWebhooks;
    const [webhookEntry] = config.webhooks;
    const capture = {
      subscribeBody: null as Record<string, unknown> | null,
    };

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([]),
      ),

      http.post(
        `${COMMERCE_BASE_URL}/webhooks/subscribe`,
        async ({ request }) => {
          capture.subscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json({});
        },
      ),
    );

    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      initialState,
      installationContext: createMockInstallationContext(),
    });

    expect.assert(isSucceededState(result));
    expect(capture.subscribeBody).toEqual({
      webhook: expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
        url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
      }),
    });

    expect(result.data).toMatchObject({
      installation: {
        webhooks: {
          subscriptions: {
            subscribedWebhooks: [
              expect.objectContaining({
                batch_name: "test_app_webhooks_default",
                developer_console_oauth: {
                  client_id: "test-client-id",
                  client_secret: "test-secret-1",
                  environment: "production",
                  org_id: "test-ims-org-id",
                },
                hook_name: "test_app_webhooks_order_created",
                method: webhookEntry.webhook.method,
                url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
                webhook_method: webhookEntry.webhook.webhook_method,
                webhook_type: webhookEntry.webhook.webhook_type,
              }),
            ],
          },
        },
      },
    });
  });
});

describe("webhooks validation integration", () => {
  test("reports webhook conflicts through the real validation tree", async () => {
    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([
          createMockExistingCommerceWebhook({
            batch_name: "other_app_default",
            hook_name: "other_app_order_created",
          }),
        ]),
      ),
    );

    const result = await runValidation({
      config: configWithWebhooks,
      validationContext: createMockInstallationContext(),
    });

    expect(result.valid).toBe(false);
    expect(result.summary).toEqual({
      errors: 0,
      totalIssues: 1,
      warnings: 1,
    });

    const subscriptionsValidation = findValidationNodeByPath(result.result, [
      "installation",
      "webhooks",
      "subscriptions",
    ]);

    expect(subscriptionsValidation?.issues).toEqual([
      expect.objectContaining({
        code: "WEBHOOK_CONFLICTS",
      }),
    ]);
  });
});

describe("webhooks upgrade planning integration", () => {
  const UPGRADE_PATH = ["upgrade", "webhooks", "subscriptions"];

  test("plans and applies an addition for a newly configured webhook", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const capture = {
      subscribeBody: null as Record<string, unknown> | null,
    };

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([]),
      ),
      http.post(
        `${COMMERCE_BASE_URL}/webhooks/subscribe`,
        async ({ request }) => {
          capture.subscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json({});
        },
      ),
    );

    const lifecycleContext = createMockInstallationContext();
    const context = {
      ...lifecycleContext,
      ...createWebhooksStepContext(lifecycleContext),
    };

    const planResult = await planWebhookSubscriptions(
      {
        baseline: null,
        path: UPGRADE_PATH,
        targetConfig: configWithWebhooks,
      },
      context,
    );

    expect.assert(planResult.kind === "planned");
    expect(planResult.plan.operations).toEqual([
      expect.objectContaining({ kind: "add" }),
    ]);
    expect(planResult.plan.operations[0]).not.toHaveProperty(
      "after.developer_console_oauth",
    );

    const applyResult = await applyWebhookSubscriptions(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
      baseline: null,
      targetConfig: configWithWebhooks,
    });

    expect(capture.subscribeBody).toMatchObject({
      webhook: expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        developer_console_oauth: expect.any(Object),
        hook_name: "test_app_webhooks_order_created",
      }),
    });
    expect(applyResult.snapshotData?.subscribedWebhooks).toEqual([
      expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
      }),
    ]);
    expect(applyResult.snapshotData?.subscribedWebhooks[0]).not.toHaveProperty(
      "developer_console_oauth",
    );
  });

  test("prunes a live app webhook absent from the baseline and target", async () => {
    const [subscribedWebhook] = configWithWebhooks.webhooks;
    const baselineWebhook = {
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
      method: subscribedWebhook.webhook.method,
      url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
      webhook_method: subscribedWebhook.webhook.webhook_method,
      webhook_type: subscribedWebhook.webhook.webhook_type,
    };
    const foreignWebhook = {
      ...baselineWebhook,
      batch_name: "other_app_default",
      hook_name: "other_app_order_created",
    };

    const capture = {
      unsubscribeBody: null as Record<string, unknown> | null,
    };

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([baselineWebhook, foreignWebhook]),
      ),
      http.post(
        `${COMMERCE_BASE_URL}/webhooks/unsubscribe`,
        async ({ request }) => {
          capture.unsubscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json({});
        },
      ),
    );

    const lifecycleContext = createMockInstallationContext();
    const context = {
      ...lifecycleContext,
      ...createWebhooksStepContext(lifecycleContext),
    };
    const baseline = {
      config: configWithWebhooks,
      data: { subscribedWebhooks: [] },
    };

    const planResult = await planWebhookSubscriptions(
      {
        baseline,
        path: UPGRADE_PATH,
        targetConfig: null,
      },
      context,
    );

    expect.assert(planResult.kind === "planned");
    expect(planResult.plan.operations).toEqual([]);

    const applyResult = await applyWebhookSubscriptions(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
      baseline,
      targetConfig: null,
    });

    expect(capture.unsubscribeBody).toEqual({
      webhook: expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
      }),
    });
    expect(applyResult.snapshotData?.subscribedWebhooks).toEqual([]);
  });

  test("plans and applies an update for a webhook whose config changed", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const [subscribedWebhook] = configWithWebhooks.webhooks;
    const baselineWebhook = {
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
      method: subscribedWebhook.webhook.method,
      url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
      webhook_method: subscribedWebhook.webhook.webhook_method,
      webhook_type: subscribedWebhook.webhook.webhook_type,
    };

    const targetConfig = {
      ...configWithWebhooks,
      webhooks: [
        {
          ...configWithWebhooks.webhooks[0],
          webhook: {
            ...configWithWebhooks.webhooks[0].webhook,
            fields: [{ name: "sku" }],
          },
        },
      ],
    };

    const capture = {
      subscribeBody: null as Record<string, unknown> | null,
      unsubscribeBody: null as Record<string, unknown> | null,
    };

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([baselineWebhook]),
      ),
      http.post(
        `${COMMERCE_BASE_URL}/webhooks/unsubscribe`,
        async ({ request }) => {
          capture.unsubscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json({});
        },
      ),
      http.post(
        `${COMMERCE_BASE_URL}/webhooks/subscribe`,
        async ({ request }) => {
          capture.subscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json({});
        },
      ),
    );

    const lifecycleContext = createMockInstallationContext();
    const context = {
      ...lifecycleContext,
      ...createWebhooksStepContext(lifecycleContext),
    };
    const baseline = {
      config: configWithWebhooks,
      data: { subscribedWebhooks: [baselineWebhook] },
    };

    const planResult = await planWebhookSubscriptions(
      {
        baseline,
        path: UPGRADE_PATH,
        targetConfig,
      },
      context,
    );

    expect.assert(planResult.kind === "planned");
    expect(planResult.plan.operations).toEqual([
      expect.objectContaining({ kind: "update" }),
    ]);

    const applyResult = await applyWebhookSubscriptions(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
      baseline,
      targetConfig,
    });

    expect(capture.unsubscribeBody).toEqual({
      webhook: expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
      }),
    });
    expect(capture.subscribeBody).toMatchObject({
      webhook: expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        fields: [{ name: "sku" }],
        hook_name: "test_app_webhooks_order_created",
      }),
    });
    expect(applyResult.snapshotData?.subscribedWebhooks).toEqual([
      expect.objectContaining({ fields: [{ name: "sku" }] }),
    ]);
  });

  test("restores the removed webhook when Commerce rejects a plugin.my_invented_webhook replacement", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const [subscribedWebhook] = configWithWebhooks.webhooks;
    const baselineWebhook = {
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
      method: subscribedWebhook.webhook.method,
      url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
      webhook_method: subscribedWebhook.webhook.webhook_method,
      webhook_type: subscribedWebhook.webhook.webhook_type,
    };

    // webhook_method is an identity field, so changing it plans a remove-then-add.
    const targetConfig = {
      ...configWithWebhooks,
      webhooks: [
        {
          ...configWithWebhooks.webhooks[0],
          webhook: {
            ...configWithWebhooks.webhooks[0].webhook,
            webhook_method: "plugin.my_invented_webhook",
          },
        },
      ],
    };

    const subscribedMethods: string[] = [];
    let unsubscribed = false;

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([baselineWebhook]),
      ),
      http.post(`${COMMERCE_BASE_URL}/webhooks/unsubscribe`, () => {
        unsubscribed = true;
        return HttpResponse.json({});
      }),
      http.post(
        `${COMMERCE_BASE_URL}/webhooks/subscribe`,
        async ({ request }) => {
          const body = (await request.json()) as {
            webhook: { webhook_method: string };
          };
          subscribedMethods.push(body.webhook.webhook_method);

          if (body.webhook.webhook_method === "plugin.my_invented_webhook") {
            // Commerce rejects a webhook_method it does not support.
            return HttpResponse.json(
              { message: "Invalid webhook_method" },
              { status: 400 },
            );
          }
          return HttpResponse.json({});
        },
      ),
    );

    const lifecycleContext = createMockInstallationContext();
    const context = {
      ...lifecycleContext,
      ...createWebhooksStepContext(lifecycleContext),
    };
    const baseline = {
      config: configWithWebhooks,
      data: { subscribedWebhooks: [baselineWebhook] },
    };

    const planResult = await planWebhookSubscriptions(
      { baseline, path: UPGRADE_PATH, targetConfig },
      context,
    );
    expect.assert(planResult.kind === "planned");
    expect(planResult.plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "add" }),
        expect.objectContaining({ kind: "remove" }),
      ]),
    );

    // The apply fails (no snapshot returned, so the baseline is never advanced).
    const applyResult = await applyWebhookSubscriptions(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
      baseline,
      targetConfig,
    }).catch((error: unknown) => error);
    expect(applyResult).toBeInstanceOf(Error);

    // The old webhook was removed, the replacement rejected, and the old one re-subscribed on
    // recovery — so Commerce is back at the baseline.
    expect(unsubscribed).toBe(true);
    expect(subscribedMethods).toContain("plugin.my_invented_webhook");
    expect(subscribedMethods).toContain(
      subscribedWebhook.webhook.webhook_method,
    );
  });
});
