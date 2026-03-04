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

import {
  createOrGetWebhookSubscription,
  createWebhookSubscription,
  createWebhookSubscriptions,
  resolveDeveloperConsoleOAuthCredentials,
  validateWebhookConflicts,
} from "#management/installation/webhooks/helpers";
import { configWithWebhooks } from "#test/fixtures/config";

import type { WebhooksExecutionContext } from "#management/installation/webhooks/context";

const DEFAULT_PARAMS = {
  AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
  AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "test-client-secret",
  AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
};

function makeContext(
  subscribeWebhookFn = vi.fn().mockResolvedValue(null),
  getWebhookListFn = vi.fn().mockResolvedValue([]),
  params = DEFAULT_PARAMS,
): WebhooksExecutionContext {
  return {
    params,
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
          category: "modification" as const,
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
          category: "modification" as const,
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
          category: "modification" as const,
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
          category: "modification" as const,
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
          category: "modification" as const,
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
          category: "modification" as const,
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
          category: "modification" as const,
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
          category: "modification" as const,
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

  test("injects developer_console_oauth from params when requireAdobeAuth is true or absent", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const config = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Test webhook",
          category: "modification" as const,
          runtimeAction: "my-package/handle-webhook",
          // requireAdobeAuth intentionally absent (defaults to true)
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

    await createWebhookSubscriptions(config, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        developer_console_oauth: {
          client_id: DEFAULT_PARAMS.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
          client_secret: DEFAULT_PARAMS.AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS,
          org_id: DEFAULT_PARAMS.AIO_COMMERCE_AUTH_IMS_ORG_ID,
          environment: "production",
        },
      }),
    );
  });

  test("does not inject developer_console_oauth when requireAdobeAuth is false", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const config = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Test webhook",
          category: "modification" as const,
          runtimeAction: "my-package/handle-webhook",
          requireAdobeAuth: false,
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

    await createWebhookSubscriptions(config, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.not.objectContaining({
        developer_console_oauth: expect.anything(),
      }),
    );
  });

  test("throws when requireAdobeAuth is true but credentials are missing", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const emptyParams = {
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "",
    };
    const context = makeContext(
      subscribeWebhook,
      vi.fn().mockResolvedValue([]),
      emptyParams,
    );

    const config = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Test webhook",
          category: "modification" as const,
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

    await expect(createWebhookSubscriptions(config, context)).rejects.toThrow(
      Error,
    );
    expect(subscribeWebhook).not.toHaveBeenCalled();
  });
});

describe("createWebhookSubscription", () => {
  const resolvedWebhook = {
    webhook_method: "observer.catalog_product_save_after",
    webhook_type: "after",
    batch_name: "my_app_batch",
    hook_name: "my_app_hook",
    url: "https://example.com/hook",
    method: "POST",
  };

  test("calls subscribeWebhook and returns the resolved webhook", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const client = { subscribeWebhook } as never;

    const result = await createWebhookSubscription(client, resolvedWebhook);

    expect(subscribeWebhook).toHaveBeenCalledWith(resolvedWebhook);
    expect(result).toBe(resolvedWebhook);
  });

  test("throws enriched error when HTTPError response body has a string message", async () => {
    const { HTTPError } = await import("@adobe/aio-commerce-lib-api/ky");

    const mockResponse = {
      json: vi.fn().mockResolvedValue({ message: "Duplicate webhook" }),
    };
    const httpError = new HTTPError(
      mockResponse as unknown as Response,
      new Request("https://example.com"),
      {} as never,
    );

    const client = {
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    } as never;

    await expect(
      createWebhookSubscription(client, resolvedWebhook),
    ).rejects.toThrow(
      'Webhook subscription failed for "observer.catalog_product_save_after:after": Duplicate webhook',
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

    const client = {
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    } as never;

    await expect(
      createWebhookSubscription(client, resolvedWebhook),
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

    const client = {
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    } as never;

    await expect(
      createWebhookSubscription(client, resolvedWebhook),
    ).rejects.toThrow(httpError);
  });
});

describe("createOrGetWebhookSubscription", () => {
  const resolvedWebhook = {
    webhook_method: "observer.catalog_product_save_after",
    webhook_type: "after",
    batch_name: "my_app_batch",
    hook_name: "my_app_hook",
    url: "https://example.com/hook",
    method: "POST",
  };

  const makeLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  });

  test("skips the API call and returns the webhook when already subscribed", async () => {
    const subscribeWebhook = vi.fn();
    const client = { subscribeWebhook } as never;
    const logger = makeLogger();

    const result = await createOrGetWebhookSubscription(
      [resolvedWebhook],
      client,
      resolvedWebhook,
      logger as never,
    );

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(result).toBe(resolvedWebhook);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("already subscribed"),
    );
  });

  test("calls the API and returns the webhook when not yet subscribed", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const client = { subscribeWebhook } as never;
    const logger = makeLogger();

    const result = await createOrGetWebhookSubscription(
      [],
      client,
      resolvedWebhook,
      logger as never,
    );

    expect(subscribeWebhook).toHaveBeenCalledWith(resolvedWebhook);
    expect(result).toBe(resolvedWebhook);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Subscribed webhook"),
    );
  });
});

describe("validateWebhookConflicts", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns [] when config has no modification webhooks", async () => {
    const context = makeContext();
    const config = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Validation webhook",
          category: "validation" as const,
          webhook: {
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "before",
            batch_name: "default",
            hook_name: "order_created",
            method: "POST",
            url: "https://example.com/hook",
          },
        },
      ],
    };

    await expect(validateWebhookConflicts(config, context)).resolves.toEqual(
      [],
    );
  });

  test("returns [] when Commerce has no existing webhooks", async () => {
    const getWebhookList = vi.fn().mockResolvedValue([]);
    const context = makeContext(vi.fn(), getWebhookList);

    await expect(
      validateWebhookConflicts(configWithWebhooks, context),
    ).resolves.toEqual([]);
  });

  test("returns [] when existing Commerce webhook belongs to this app (same batch_name and hook_name after prefix)", async () => {
    // configWithWebhooks metadata.id = "test-app-webhooks" → prefix "test_app_webhooks_"
    const sameAppWebhook = {
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
    };
    const getWebhookList = vi.fn().mockResolvedValue([sameAppWebhook]);
    const context = makeContext(vi.fn(), getWebhookList);

    await expect(
      validateWebhookConflicts(configWithWebhooks, context),
    ).resolves.toEqual([]);
  });

  test("returns a ValidationIssue with code WEBHOOK_CONFLICTS when a modification webhook conflicts with another app", async () => {
    const conflictingWebhook = {
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
      batch_name: "other_app_default",
      hook_name: "other_app_order_created",
    };
    const getWebhookList = vi.fn().mockResolvedValue([conflictingWebhook]);
    const context = makeContext(vi.fn(), getWebhookList);

    const issues = await validateWebhookConflicts(configWithWebhooks, context);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: "WEBHOOK_CONFLICTS",
      severity: "error",
    });
    expect(issues[0].details?.conflicts).toContainEqual(
      expect.objectContaining({
        webhook_method: "plugin.order.api.order_created",
        webhook_type: "after",
        batch_name: "other_app_default",
        hook_name: "other_app_order_created",
      }),
    );
  });

  test("includes all conflicting Commerce webhooks in details.conflicts", async () => {
    const config = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "First modification webhook",
          category: "modification" as const,
          runtimeAction: "my-package/handle-order",
          webhook: {
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "after",
            batch_name: "default",
            hook_name: "order_created",
            method: "POST",
          },
        },
        {
          description: "Second modification webhook",
          category: "modification" as const,
          runtimeAction: "my-package/handle-product",
          webhook: {
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
            batch_name: "products",
            hook_name: "validate",
            method: "POST",
          },
        },
      ],
    };

    const conflictForFirst = {
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
      batch_name: "other_app_default",
      hook_name: "other_app_order_created",
    };
    const conflictForSecond = {
      webhook_method: "observer.catalog_product_save_after",
      webhook_type: "after",
      batch_name: "another_app_products",
      hook_name: "another_app_validate",
    };

    const getWebhookList = vi
      .fn()
      .mockResolvedValue([conflictForFirst, conflictForSecond]);
    const context = makeContext(vi.fn(), getWebhookList);

    const issues = await validateWebhookConflicts(config, context);

    expect(issues).toHaveLength(1);
    expect(issues[0].details?.conflicts).toHaveLength(2);
    expect(issues[0].details?.conflicts).toContainEqual(
      expect.objectContaining({
        webhook_method: "plugin.order.api.order_created",
        webhook_type: "after",
        batch_name: "other_app_default",
        hook_name: "other_app_order_created",
      }),
    );
    expect(issues[0].details?.conflicts).toContainEqual(
      expect.objectContaining({
        webhook_method: "observer.catalog_product_save_after",
        webhook_type: "after",
        batch_name: "another_app_products",
        hook_name: "another_app_validate",
      }),
    );
  });

  test("returns [] for webhooks with category other than modification", async () => {
    const config = {
      ...configWithWebhooks,
      webhooks: [
        {
          description: "Append webhook",
          category: "append" as const,
          webhook: {
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "after",
            batch_name: "default",
            hook_name: "order_created",
            method: "POST",
            url: "https://example.com/hook",
          },
        },
        {
          description: "No category webhook",
          webhook: {
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "after",
            batch_name: "default2",
            hook_name: "order_created2",
            method: "POST",
            url: "https://example.com/hook2",
          },
        },
      ],
    };

    const conflictingWebhook = {
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
      batch_name: "other_app_batch",
      hook_name: "other_app_hook",
    };
    const getWebhookList = vi.fn().mockResolvedValue([conflictingWebhook]);
    const context = makeContext(vi.fn(), getWebhookList);

    await expect(validateWebhookConflicts(config, context)).resolves.toEqual(
      [],
    );
    expect(getWebhookList).not.toHaveBeenCalled();
  });
});

describe("resolveDeveloperConsoleOAuthCredentials", () => {
  test("returns credentials object when all values are present (string secret)", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
    });

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      org_id: "org-id",
      environment: "production",
    });
  });

  test("returns credentials object using first element when secrets is an array", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: [
        "primary-secret",
        "secondary-secret",
      ],
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
    });

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "primary-secret",
      org_id: "org-id",
      environment: "production",
    });
  });

  test("sets environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT starts with prod", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "prod",
    });

    expect(result.environment).toBe("production");
  });

  test("sets environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is production", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "production",
    });

    expect(result.environment).toBe("production");
  });

  test("sets environment to staging when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT does not start with prod", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "stage",
    });

    expect(result.environment).toBe("staging");
  });

  test("defaults environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is absent", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
    });

    expect(result.environment).toBe("production");
  });

  test("defaults environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is empty", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "",
    });

    expect(result.environment).toBe("production");
  });

  test("throws when one of the fields is empty", () => {
    expect(() =>
      resolveDeveloperConsoleOAuthCredentials({
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
      }),
    ).toThrow("Failed to retrieve IMS credentials");
  });
});
