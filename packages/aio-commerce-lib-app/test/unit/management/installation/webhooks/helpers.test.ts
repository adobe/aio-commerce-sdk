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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createWebhookSubscriptions } from "#management/installation/webhooks/helpers";
import { configWithWebhooks, minimalValidConfig } from "#test/fixtures/config";

import type { WebhooksExecutionContext } from "#management/installation/webhooks/context";

function makeContext(
  subscribeWebhookFn = vi.fn().mockResolvedValue(null),
  getWebhookListFn = vi.fn().mockResolvedValue([]),
): WebhooksExecutionContext {
  return {
    commerceWebhooksClient: {
      getWebhookList: getWebhookListFn,
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
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns empty subscribedWebhooks when no webhooks are configured", async () => {
    const context = makeContext();
    const result = await createWebhookSubscriptions(
      minimalValidConfig,
      context,
    );

    expect(result.subscribedWebhooks).toHaveLength(0);
    expect(
      context.commerceWebhooksClient.subscribeWebhook,
    ).not.toHaveBeenCalled();
  });

  test("calls subscribeWebhook for each entry and returns subscribed webhooks", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const result = await createWebhookSubscriptions(
      configWithWebhooks,
      context,
    );

    expect(subscribeWebhook).toHaveBeenCalledTimes(
      configWithWebhooks.webhooks.length,
    );
    expect(result.subscribedWebhooks).toHaveLength(
      configWithWebhooks.webhooks.length,
    );
  });

  test("passes webhook.url directly when it is explicitly set", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const explicitUrl = "https://explicit-url.com/hook";
    const configWithExplicitUrl = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Webhook with explicit url",
          category: "modification",
          runtimeAction: "my-package/handle-webhook",
          webhook: {
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "after",
            batch_name: "default",
            hook_name: "order_created",
            method: "POST",
            url: explicitUrl,
          },
        },
      ],
    };

    await createWebhookSubscriptions(configWithExplicitUrl, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ url: explicitUrl }),
    );
  });

  test("generates url from runtimeAction when webhook.url is absent", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const configWithoutUrl = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Webhook without url",
          category: "test",
          runtimeAction: "my-package/handle-webhook",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "batch1",
            hook_name: "hook1",
            method: "POST",
            // url intentionally omitted
          },
        },
      ],
    };

    await createWebhookSubscriptions(configWithoutUrl, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook",
      }),
    );
  });

  test("throws when namespace is not set and runtimeAction has no explicit url", async () => {
    vi.unstubAllEnvs();

    const context = makeContext();

    const configWithoutUrl = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Webhook without url",
          category: "test",
          runtimeAction: "my-package/handle-webhook",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "batch1",
            hook_name: "hook1",
            method: "POST",
          },
        },
      ],
    };

    await expect(
      createWebhookSubscriptions(configWithoutUrl, context),
    ).rejects.toThrow(
      'Cannot generate URL for runtime action "my-package/handle-webhook": namespace environment variable is not set.',
    );
  });

  test("prepends sanitized metadata.id prefix to batch_name and hook_name", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const config = {
      metadata: {
        id: "my--app.v2",
        displayName: "My App",
        description: "d",
        version: "1.0.0",
      },
      webhooks: [
        {
          description: "Test webhook",
          runtimeAction: "my-package/handle-webhook",
          category: "modification",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "products",
            hook_name: "validate",
            method: "POST",
            url: "https://example.com/hook",
          },
        },
      ],
    };

    await createWebhookSubscriptions(config, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_name: "my_app_v2_products",
        hook_name: "my_app_v2_validate",
      }),
    );
    // Consecutive underscores from "--" are collapsed to a single one ("my__app" → "my_app")
  });

  test("throws on the first subscription failure and does not process remaining webhooks", async () => {
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
          category: "modification",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "batch2",
            hook_name: "second_hook",
            url: "https://example.com/second",
            method: "POST",
          },
        },
      ],
    };

    const context = makeContext(subscribeWebhook);

    await expect(createWebhookSubscriptions(config, context)).rejects.toThrow(
      error,
    );
    expect(subscribeWebhook).toHaveBeenCalledTimes(1);
  });

  test("throws with response message and webhook name when HTTPError body has a string message", async () => {
    const { HTTPError } = await import("@adobe/aio-commerce-lib-api/ky");

    const responseBody = { message: "Duplicate webhook registration" };
    const mockResponse = {
      json: vi.fn().mockResolvedValue(responseBody),
    };

    const httpError = new HTTPError(
      mockResponse as unknown as Response,
      new Request("https://example.com"),
      {} as never,
    );

    const subscribeWebhook = vi.fn().mockRejectedValue(httpError);
    const context = makeContext(subscribeWebhook);

    const singleWebhookConfig = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Test webhook",
          runtimeAction: "my-package/handle-webhook",
          category: "modification",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "batch1",
            hook_name: "hook1",
            method: "POST",
            url: "https://example.com/hook",
          },
        },
      ],
    };

    await expect(
      createWebhookSubscriptions(singleWebhookConfig, context),
    ).rejects.toThrow(
      'Webhook subscription failed for "observer.catalog_product_save_after:after": Duplicate webhook registration',
    );
  });

  test("rethrows the original HTTPError when response body has no string message", async () => {
    const { HTTPError } = await import("@adobe/aio-commerce-lib-api/ky");

    const mockResponse = {
      json: vi.fn().mockResolvedValue({ code: 422 }),
    };

    const httpError = new HTTPError(
      mockResponse as unknown as Response,
      new Request("https://example.com"),
      {} as never,
    );

    const subscribeWebhook = vi.fn().mockRejectedValue(httpError);
    const context = makeContext(subscribeWebhook);

    await expect(
      createWebhookSubscriptions(configWithWebhooks, context),
    ).rejects.toThrow(httpError);
  });

  test("rethrows the original HTTPError when response body cannot be parsed as JSON", async () => {
    const { HTTPError } = await import("@adobe/aio-commerce-lib-api/ky");

    const mockResponse = {
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    };

    const httpError = new HTTPError(
      mockResponse as unknown as Response,
      new Request("https://example.com"),
      {} as never,
    );

    const subscribeWebhook = vi.fn().mockRejectedValue(httpError);
    const context = makeContext(subscribeWebhook);

    await expect(
      createWebhookSubscriptions(configWithWebhooks, context),
    ).rejects.toThrow(httpError);
  });

  test("skips subscribeWebhook call but still includes webhook in result when already subscribed", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    // configWithWebhooks has metadata.id "test-app-webhooks" → prefix "test_app_webhooks_"
    // resolved batch_name = "test_app_webhooks_default", hook_name = "test_app_webhooks_order_created"
    const existingWebhook = {
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
    };
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    const context = makeContext(subscribeWebhook, getWebhookList);

    const result = await createWebhookSubscriptions(
      configWithWebhooks,
      context,
    );

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(result.subscribedWebhooks).toHaveLength(
      configWithWebhooks.webhooks.length,
    );
  });

  test("subscribes only webhooks not already in the existing list", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);

    const twoWebhookConfig = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "First webhook",
          runtimeAction: "my-package/handle-webhook",
          category: "modification",
          webhook: {
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "after",
            batch_name: "default",
            hook_name: "order_created",
            method: "POST",
            url: "https://example.com/first",
          },
        },
        {
          description: "Second webhook",
          runtimeAction: "my-package/handle-webhook",
          category: "modification",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "products",
            hook_name: "validate",
            method: "POST",
            url: "https://example.com/second",
          },
        },
      ],
    };

    // Only the first webhook is already subscribed (with resolved names)
    const existingWebhook = {
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
    };
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    const context = makeContext(subscribeWebhook, getWebhookList);

    const result = await createWebhookSubscriptions(twoWebhookConfig, context);

    expect(subscribeWebhook).toHaveBeenCalledTimes(1);
    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        webhook_method: "observer.catalog_product_save_after",
        batch_name: "test_app_webhooks_products",
        hook_name: "test_app_webhooks_validate",
      }),
    );
    expect(result.subscribedWebhooks).toHaveLength(2);
  });
});
