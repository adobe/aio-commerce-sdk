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

import { describe, expect, test, vi } from "vitest";

import { createWebhookSubscriptions } from "#management/installation/webhooks/helpers";
import { configWithWebhooks, minimalValidConfig } from "#test/fixtures/config";

import type { WebhooksExecutionContext } from "#management/installation/webhooks/context";

function makeContext(
  subscribeWebhookFn = vi.fn().mockResolvedValue(null),
): WebhooksExecutionContext {
  return {
    commerceWebhooksClient: {
      subscribeWebhook: subscribeWebhookFn,
    },
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
  } as unknown as WebhooksExecutionContext;
}

describe("createWebhookSubscriptions", () => {
  test("returns zero subscriptions when no webhooks are configured", async () => {
    const context = makeContext();
    const result = await createWebhookSubscriptions(
      minimalValidConfig,
      context,
    );

    expect(result.subscriptionsCreated).toBe(0);
    expect(result.failures).toHaveLength(0);
    expect(
      context.commerceWebhooksClient.subscribeWebhook,
    ).not.toHaveBeenCalled();
  });

  test("calls subscribeWebhook for each entry and returns count", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const result = await createWebhookSubscriptions(
      configWithWebhooks,
      context,
    );

    expect(subscribeWebhook).toHaveBeenCalledTimes(
      configWithWebhooks.webhooks.length,
    );
    expect(result.subscriptionsCreated).toBe(
      configWithWebhooks.webhooks.length,
    );
    expect(result.failures).toHaveLength(0);
  });

  test("passes the webhook payload (entry.webhook) to subscribeWebhook", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    await createWebhookSubscriptions(configWithWebhooks, context);

    for (const entry of configWithWebhooks.webhooks) {
      expect(subscribeWebhook).toHaveBeenCalledWith(entry.webhook);
    }
  });

  test("collects failures and continues processing remaining webhooks", async () => {
    const error = new Error("Commerce API error");
    const subscribeWebhook = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(null);

    const config = {
      ...configWithWebhooks,
      webhooks: [
        ...configWithWebhooks.webhooks,
        {
          description: "Second webhook",
          runtimeAction: "my-package/second-hook",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "batch2",
            hook_name: "second-hook",
            url: "https://example.com/second",
            method: "POST",
          },
        },
      ],
    };

    const context = makeContext(subscribeWebhook);
    const result = await createWebhookSubscriptions(config, context);

    expect(subscribeWebhook).toHaveBeenCalledTimes(2);
    expect(result.subscriptionsCreated).toBe(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures.at(0)?.error).toBe(error);
  });
});
