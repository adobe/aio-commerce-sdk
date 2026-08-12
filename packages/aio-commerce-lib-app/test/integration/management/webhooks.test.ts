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
import { createWebhooksStepContext } from "#management/domains/webhooks/context";
import {
  applyWebhookSubscriptions,
  planWebhookSubscriptions,
} from "#management/domains/webhooks/helpers";
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
        unresolvedCleanupResources: [],
      },
      context,
    );

    expect.assert(planResult.kind === "planned");
    expect(planResult.plan.operations).toEqual([
      expect.objectContaining({ category: "configuration", kind: "add" }),
    ]);
    expect(planResult.plan.operations[0]).not.toHaveProperty(
      "after.developer_console_oauth",
    );

    const applyResult = await applyWebhookSubscriptions(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
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
    expect(applyResult.resolvedCleanupResources).toHaveLength(1);
  });

  test("plans and applies a removal for a webhook dropped from the target config", async () => {
    const [subscribedWebhook] = configWithWebhooks.webhooks;
    const baselineWebhook = {
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
      method: subscribedWebhook.webhook.method,
      url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
      webhook_method: subscribedWebhook.webhook.webhook_method,
      webhook_type: subscribedWebhook.webhook.webhook_type,
    };

    const capture = {
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
    );

    const lifecycleContext = createMockInstallationContext();
    const context = {
      ...lifecycleContext,
      ...createWebhooksStepContext(lifecycleContext),
    };

    const planResult = await planWebhookSubscriptions(
      {
        baseline: {
          config: configWithWebhooks,
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig: null,
        unresolvedCleanupResources: [],
      },
      context,
    );

    expect.assert(planResult.kind === "planned");
    expect(planResult.plan.operations).toEqual([
      expect.objectContaining({ category: "configuration", kind: "remove" }),
    ]);

    const applyResult = await applyWebhookSubscriptions(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
    });

    expect(capture.unsubscribeBody).toEqual({
      webhook: expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
      }),
    });
    expect(applyResult.snapshotData?.subscribedWebhooks).toEqual([]);
    expect(applyResult.resolvedCleanupResources).toHaveLength(1);
  });

  test("re-subscribes a webhook whose baseline is stale after a partially-applied removal", async () => {
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
    const baselineIdentity = {
      batch_name: baselineWebhook.batch_name,
      hook_name: baselineWebhook.hook_name,
      webhook_method: baselineWebhook.webhook_method,
      webhook_type: baselineWebhook.webhook_type,
    };

    const capture = {
      subscribeBody: null as Record<string, unknown> | null,
    };

    apiServer.use(
      // A prior attempt already unsubscribed this webhook from Commerce, but
      // never got to record it (a later step in that attempt failed first).
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
        baseline: {
          config: configWithWebhooks,
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig: configWithWebhooks,
        unresolvedCleanupResources: [
          { identity: baselineIdentity, path: UPGRADE_PATH },
        ],
      },
      context,
    );

    expect.assert(planResult.kind === "planned");
    expect(planResult.plan.retainedWebhooks).toHaveLength(0);
    expect(planResult.plan.operations).toEqual([
      expect.objectContaining({ category: "configuration", kind: "add" }),
    ]);

    await applyWebhookSubscriptions(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
    });

    expect(capture.subscribeBody).toMatchObject({
      webhook: expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
      }),
    });
  });
});
