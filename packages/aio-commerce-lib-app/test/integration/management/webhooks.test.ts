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

import {
  createInitialInstallationState,
  runInstallation,
  runValidation,
} from "#management/installation/runner";
import { isSucceededState } from "#management/installation/workflow/types";
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

  return;
}

setupApiTestLifecycle();
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("webhooks installation integration", () => {
  test("runs the real webhooks branch and stores the resolved subscriptions", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const config = configWithWebhooks;
    const webhookEntry = config.webhooks[0];
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
      installationContext: createMockInstallationContext(),
      initialState,
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
                webhook_method: webhookEntry.webhook.webhook_method,
                webhook_type: webhookEntry.webhook.webhook_type,
                batch_name: "test_app_webhooks_default",
                hook_name: "test_app_webhooks_order_created",
                method: webhookEntry.webhook.method,
                url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
                developer_console_oauth: {
                  client_id: "test-client-id",
                  client_secret: "test-secret-1",
                  org_id: "test-ims-org-id",
                  environment: "production",
                },
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
      warnings: 1,
      totalIssues: 1,
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
