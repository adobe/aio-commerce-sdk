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
  buildWebhookIdPrefix,
  createOrGetWebhookSubscription,
  createWebhookSubscription,
  createWebhookSubscriptions,
  deleteWebhookSubscriptions,
  resolveDeveloperConsoleOAuthCredentials,
  validateWebhookConflicts,
} from "#management/installation/webhooks/helpers";
import { configWithWebhooks, createMockMetadata } from "#test/fixtures/config";
import { makeHttpError } from "#test/fixtures/http-error";
import {
  createMockInstallationParams,
  createMockLogger,
  DEFAULT_INSTALLATION_IMS_PARAMS,
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";
import {
  createMockCommerceWebhooksClient,
  createMockExistingCommerceWebhook,
  createMockResolvedWebhook,
  createMockRuntimeWebhookEntry,
  createMockUrlWebhookEntry,
  createMockWebhooksConfig,
  createMockWebhooksContext,
} from "#test/fixtures/webhooks";

import type { WebhooksExecutionContext } from "#management/installation/webhooks/context";

const DEFAULT_PARAMS = DEFAULT_INSTALLATION_PARAMS;

function makeContext(
  subscribeWebhookFn = vi.fn().mockResolvedValue(null),
  getWebhookListFn = vi.fn().mockResolvedValue([]),
  params: Partial<WebhooksExecutionContext["params"]> = DEFAULT_PARAMS,
  unsubscribeWebhookFn = vi.fn().mockResolvedValue(null),
): WebhooksExecutionContext {
  return createMockWebhooksContext(
    subscribeWebhookFn,
    getWebhookListFn,
    params,
    unsubscribeWebhookFn,
  );
}

function makeWebhookClient(
  subscribeWebhook = vi.fn().mockResolvedValue(null),
): WebhooksExecutionContext["commerceWebhooksClient"] {
  return createMockCommerceWebhooksClient({
    subscribeWebhook,
  });
}

function makeWebhookLogger(): WebhooksExecutionContext["logger"] {
  return createMockLogger();
}

function createDefaultWebhooksConfig() {
  return createMockWebhooksConfig();
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
    const config = createDefaultWebhooksConfig();

    const result = await createWebhookSubscriptions(config, context);

    expect(subscribeWebhook).toHaveBeenCalledTimes(config.webhooks.length);
    expect(result.subscribedWebhooks).toHaveLength(config.webhooks.length);
  });

  test("skips webhooks scoped to a different environment", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(
      subscribeWebhook,
      vi.fn().mockResolvedValue([]),
      {
        ...DEFAULT_PARAMS,
        AIO_COMMERCE_API_FLAVOR: "saas",
      },
    );

    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          env: ["paas"],
          label: "PaaS only",
          webhook: { hook_name: "paas_only" },
        }),
        createMockRuntimeWebhookEntry({
          label: "All envs",
          webhook: { hook_name: "all_envs" },
        }),
      ],
    });

    const result = await createWebhookSubscriptions(config, context);

    expect(subscribeWebhook).toHaveBeenCalledTimes(1);
    expect(result.subscribedWebhooks).toHaveLength(1);
    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        hook_name: expect.stringContaining("all_envs"),
      }),
    );
  });

  test("passes webhook.url directly when it is explicitly set", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const explicitUrl = "https://explicit-url.com/hook";
    const configWithExplicitUrl = createMockWebhooksConfig({
      webhooks: [
        createMockUrlWebhookEntry({
          description: "Webhook with explicit url",
          label: "Explicit URL Webhook",
          webhook: {
            batch_name: "default",
            hook_name: "order_created",
            url: explicitUrl,
            webhook_method: "plugin.order.api.order_created",
          },
        }),
      ],
    });

    await createWebhookSubscriptions(configWithExplicitUrl, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ url: explicitUrl }),
    );
  });

  test("generates url from runtimeAction when webhook.url is absent", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const configWithoutUrl = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          description: "Webhook without url",
          label: "Generated URL Webhook",
          runtimeAction: "my-package/handle-webhook",
          webhook: {
            batch_name: "batch1",
            hook_name: "hook1",
          },
        }),
      ],
    });

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

    const configWithoutUrl = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          description: "Webhook without url",
          label: "Generated URL Webhook",
          runtimeAction: "my-package/handle-webhook",
          webhook: {
            batch_name: "batch1",
            hook_name: "hook1",
          },
        }),
      ],
    });

    await expect(
      createWebhookSubscriptions(configWithoutUrl, context),
    ).rejects.toThrow(
      'Cannot generate URL for runtime action "my-package/handle-webhook": namespace environment variable is not set.',
    );
  });

  test("prepends sanitized metadata.id prefix to batch_name and hook_name", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const config = createMockWebhooksConfig({
      metadata: createMockMetadata("test-app-webhooks", {
        description: "d",
        displayName: "My App",
        id: "my--app.v2",
      }),
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "products",
            hook_name: "validate",
          },
        }),
      ],
    });

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
    const subscribeWebhook = vi
      .fn()
      .mockRejectedValueOnce(new Error("Commerce API error"))
      .mockResolvedValue(null);

    const config = createMockWebhooksConfig({
      webhooks: [
        ...createDefaultWebhooksConfig().webhooks,
        createMockRuntimeWebhookEntry({
          description: "Second webhook",
          label: "Second Webhook",
          runtimeAction: "my-package/second-hook",
          webhook: {
            batch_name: "batch2",
            hook_name: "second_hook",
            url: "https://example.com/second",
          },
        }),
      ],
    });

    const context = makeContext(subscribeWebhook);

    const thrownError = await createWebhookSubscriptions(config, context).catch(
      (e: unknown) => e,
    );
    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect(subscribeWebhook).toHaveBeenCalledTimes(1);
  });

  test("throws with response message and webhook name when HTTPError body has a string message", async () => {
    const httpError = makeHttpError(
      422,
      "Unprocessable Entity",
      JSON.stringify({ message: "Duplicate webhook registration" }),
    );

    const subscribeWebhook = vi.fn().mockRejectedValue(httpError);
    const context = makeContext(subscribeWebhook);

    const singleWebhookConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "batch1",
            hook_name: "hook1",
            url: "https://example.com/hook",
            webhook_method: "observer.catalog_product_save_after",
          },
        }),
      ],
    });

    const error = await createWebhookSubscriptions(
      singleWebhookConfig,
      context,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });

  test("throws enriched error when response body has no string message", async () => {
    const httpError = makeHttpError(
      422,
      "Unprocessable Entity",
      JSON.stringify({ code: 422 }),
    );

    const subscribeWebhook = vi.fn().mockRejectedValue(httpError);
    const context = makeContext(subscribeWebhook);

    const error = await createWebhookSubscriptions(
      createDefaultWebhooksConfig(),
      context,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });

  test("throws enriched error when response body cannot be parsed as JSON", async () => {
    const httpError = makeHttpError(400, "Bad Request", "{");

    const subscribeWebhook = vi.fn().mockRejectedValue(httpError);
    const context = makeContext(subscribeWebhook);

    const error = await createWebhookSubscriptions(
      createDefaultWebhooksConfig(),
      context,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });

  test("skips subscribeWebhook call but still includes webhook in result when already subscribed", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    // configWithWebhooks has metadata.id "test-app-webhooks" → prefix "test_app_webhooks_"
    // resolved batch_name = "test_app_webhooks_default", hook_name = "test_app_webhooks_order_created"
    const existingWebhook = createMockExistingCommerceWebhook();
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    const context = makeContext(subscribeWebhook, getWebhookList);

    const result = await createWebhookSubscriptions(
      createDefaultWebhooksConfig(),
      context,
    );

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(result.subscribedWebhooks).toHaveLength(
      createDefaultWebhooksConfig().webhooks.length,
    );
  });

  test("subscribes only webhooks not already in the existing list", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);

    const twoWebhookConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          description: "First webhook",
          label: "First Webhook",
          webhook: {
            batch_name: "default",
            hook_name: "order_created",
            url: "https://example.com/first",
            webhook_method: "plugin.order.api.order_created",
          },
        }),
        createMockRuntimeWebhookEntry({
          description: "Second webhook",
          label: "Second Webhook",
          webhook: {
            batch_name: "products",
            hook_name: "validate",
            url: "https://example.com/second",
            webhook_method: "observer.catalog_product_save_after",
          },
        }),
      ],
    });

    // Only the first webhook is already subscribed (with resolved names)
    const existingWebhook = createMockExistingCommerceWebhook();
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    const context = makeContext(subscribeWebhook, getWebhookList);

    const result = await createWebhookSubscriptions(twoWebhookConfig, context);

    expect(subscribeWebhook).toHaveBeenCalledTimes(1);
    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_name: "test_app_webhooks_products",
        hook_name: "test_app_webhooks_validate",
        webhook_method: "observer.catalog_product_save_after",
      }),
    );
    expect(result.subscribedWebhooks).toHaveLength(2);
  });

  test("injects developer_console_oauth from params when requireAdobeAuth is true or absent", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "batch1",
            hook_name: "hook1",
          },
        }),
      ],
    });

    await createWebhookSubscriptions(config, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        developer_console_oauth: {
          client_id:
            DEFAULT_INSTALLATION_IMS_PARAMS.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,

          client_secret:
            DEFAULT_INSTALLATION_IMS_PARAMS
              .AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS[0],
          environment: "production",

          org_id: DEFAULT_INSTALLATION_IMS_PARAMS.AIO_COMMERCE_AUTH_IMS_ORG_ID,
        },
      }),
    );
  });

  test("does not inject developer_console_oauth when requireAdobeAuth is false", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeContext(subscribeWebhook);

    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          requireAdobeAuth: false,
          webhook: {
            batch_name: "batch1",
            hook_name: "hook1",
          },
        }),
      ],
    });

    await createWebhookSubscriptions(config, context);
    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.not.objectContaining({
        developer_console_oauth: expect.anything(),
      }),
    );
  });

  test("throws when requireAdobeAuth is true but credentials are missing", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const emptyParams = createMockInstallationParams({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "",
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "",
      AIO_COMMERCE_AUTH_IMS_SCOPES: "",
      AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "",
      AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "",
    });

    const context = makeContext(
      subscribeWebhook,
      vi.fn().mockResolvedValue([]),
      emptyParams,
    );

    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "batch1",
            hook_name: "hook1",
          },
        }),
      ],
    });

    await expect(createWebhookSubscriptions(config, context)).rejects.toThrow();
    expect(subscribeWebhook).not.toHaveBeenCalled();
  });
});

describe("createWebhookSubscription", () => {
  const resolvedWebhook = createMockResolvedWebhook();

  test("calls subscribeWebhook and returns the resolved webhook", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const client = makeWebhookClient(subscribeWebhook);
    const result = await createWebhookSubscription(client, resolvedWebhook);

    expect(subscribeWebhook).toHaveBeenCalledWith(resolvedWebhook);
    expect(result).toBe(resolvedWebhook);
  });

  test("throws enriched error when HTTPError response body has a string message", async () => {
    const httpError = makeHttpError(
      422,
      "Unprocessable Entity",
      JSON.stringify({ message: "Duplicate webhook" }),
    );

    const client = createMockCommerceWebhooksClient({
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    });

    const error = await createWebhookSubscription(
      client,
      resolvedWebhook,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });

  test("throws enriched error when response body has no string message", async () => {
    const httpError = makeHttpError(
      422,
      "Unprocessable Entity",
      JSON.stringify({ code: 422 }),
    );
    const client = createMockCommerceWebhooksClient({
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    });

    const error = await createWebhookSubscription(
      client,
      resolvedWebhook,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });

  test("throws enriched error when response body cannot be parsed as JSON", async () => {
    const httpError = makeHttpError(400, "Bad Request", "{");
    const client = createMockCommerceWebhooksClient({
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    });

    const error = await createWebhookSubscription(
      client,
      resolvedWebhook,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });
});

describe("createOrGetWebhookSubscription", () => {
  const resolvedWebhook = createMockResolvedWebhook();

  test("skips the API call and returns the webhook when already subscribed", async () => {
    const subscribeWebhook = vi.fn();
    const client = makeWebhookClient(subscribeWebhook);
    const logger = makeWebhookLogger();

    const result = await createOrGetWebhookSubscription(
      [resolvedWebhook],
      client,
      resolvedWebhook,
      logger,
    );

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(result).toBe(resolvedWebhook);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("already subscribed"),
    );
  });

  test("calls the API and returns the webhook when not yet subscribed", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const client = makeWebhookClient(subscribeWebhook);
    const logger = makeWebhookLogger();

    const result = await createOrGetWebhookSubscription(
      [],
      client,
      resolvedWebhook,
      logger,
    );

    expect(subscribeWebhook).toHaveBeenCalledWith(resolvedWebhook);
    expect(result).toBe(resolvedWebhook);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Subscribed webhook"),
    );
  });

  test("treats plugin.magento.X and plugin.X as the same method when checking existing subscriptions", async () => {
    const subscribeWebhook = vi.fn();
    const client = makeWebhookClient(subscribeWebhook);
    const logger = makeWebhookLogger();

    const candidateWithMagento = {
      ...resolvedWebhook,
      webhook_method:
        "plugin.magento.out_of_process_shipping_methods.api.get_rates",
    };
    const existingWithoutMagento = {
      ...resolvedWebhook,
      webhook_method: "plugin.out_of_process_shipping_methods.api.get_rates",
    };

    const result = await createOrGetWebhookSubscription(
      [existingWithoutMagento],
      client,
      candidateWithMagento,
      logger,
    );

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(result).toBe(candidateWithMagento);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("already subscribed"),
    );
  });

  test("treats plugin.X and plugin.magento.X as the same method when checking existing subscriptions", async () => {
    const subscribeWebhook = vi.fn();
    const client = makeWebhookClient(subscribeWebhook);
    const logger = makeWebhookLogger();

    const candidateWithoutMagento = {
      ...resolvedWebhook,
      webhook_method: "plugin.out_of_process_shipping_methods.api.get_rates",
    };
    const existingWithMagento = {
      ...resolvedWebhook,
      webhook_method:
        "plugin.magento.out_of_process_shipping_methods.api.get_rates",
    };

    const result = await createOrGetWebhookSubscription(
      [existingWithMagento],
      client,
      candidateWithoutMagento,
      logger,
    );

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(result).toBe(candidateWithoutMagento);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("already subscribed"),
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
    const config = createMockWebhooksConfig({
      webhooks: [
        createMockUrlWebhookEntry({
          category: "validation",
          description: "Validation webhook",
          label: "Validation Webhook",
          webhook: {
            batch_name: "default",
            hook_name: "order_created",
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "before",
          },
        }),
      ],
    });

    await expect(validateWebhookConflicts(config, context)).resolves.toEqual(
      [],
    );
  });

  test("returns [] when Commerce has no existing webhooks", async () => {
    const getWebhookList = vi.fn().mockResolvedValue([]);
    const context = makeContext(vi.fn(), getWebhookList);

    await expect(
      validateWebhookConflicts(createDefaultWebhooksConfig(), context),
    ).resolves.toEqual([]);
  });

  test("returns [] when existing Commerce webhook belongs to this app (same batch_name and hook_name after prefix)", async () => {
    // configWithWebhooks metadata.id = "test-app-webhooks" → prefix "test_app_webhooks_"
    const sameAppWebhook = createMockExistingCommerceWebhook();
    const getWebhookList = vi.fn().mockResolvedValue([sameAppWebhook]);
    const context = makeContext(vi.fn(), getWebhookList);

    await expect(
      validateWebhookConflicts(createDefaultWebhooksConfig(), context),
    ).resolves.toEqual([]);
  });

  test("returns a ValidationIssue with code WEBHOOK_CONFLICTS when a modification webhook conflicts with another app", async () => {
    const conflictingWebhook = createMockExistingCommerceWebhook({
      batch_name: "other_app_default",
      hook_name: "other_app_order_created",
    });
    const getWebhookList = vi.fn().mockResolvedValue([conflictingWebhook]);
    const context = makeContext(vi.fn(), getWebhookList);

    const issues = await validateWebhookConflicts(
      createDefaultWebhooksConfig(),
      context,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: "WEBHOOK_CONFLICTS",
      severity: "warning",
    });
    expect(issues[0].details?.conflictedWebhooks).toContainEqual(
      expect.objectContaining({
        batch_name: "other_app_default",
        hook_name: "other_app_order_created",
        label: "Order Created Webhook",
        webhook_method: "plugin.order.api.order_created",
        webhook_type: "after",
      }),
    );
  });

  test("includes all conflicting Commerce webhooks in details.conflictedWebhooks", async () => {
    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          description: "First modification webhook",
          label: "Order Created Webhook",
          runtimeAction: "my-package/handle-order",
          webhook: {
            batch_name: "default",
            hook_name: "order_created",
            webhook_method: "plugin.order.api.order_created",
          },
        }),
        createMockRuntimeWebhookEntry({
          description: "Second modification webhook",
          label: "Product Save Webhook",
          runtimeAction: "my-package/handle-product",
          webhook: {
            batch_name: "products",
            hook_name: "validate",
            webhook_method: "observer.catalog_product_save_after",
          },
        }),
      ],
    });

    const conflictForFirst = createMockExistingCommerceWebhook({
      batch_name: "other_app_default",
      hook_name: "other_app_order_created",
    });
    const conflictForSecond = createMockExistingCommerceWebhook({
      batch_name: "another_app_products",
      hook_name: "another_app_validate",
      webhook_method: "observer.catalog_product_save_after",
    });

    const getWebhookList = vi
      .fn()
      .mockResolvedValue([conflictForFirst, conflictForSecond]);
    const context = makeContext(vi.fn(), getWebhookList);

    const issues = await validateWebhookConflicts(config, context);

    expect(issues).toHaveLength(1);
    expect(issues[0].details?.conflictedWebhooks).toHaveLength(2);
    expect(issues[0].details?.conflictedWebhooks).toContainEqual(
      expect.objectContaining({
        batch_name: "other_app_default",
        hook_name: "other_app_order_created",
        label: "Order Created Webhook",
        webhook_method: "plugin.order.api.order_created",
        webhook_type: "after",
      }),
    );
    expect(issues[0].details?.conflictedWebhooks).toContainEqual(
      expect.objectContaining({
        batch_name: "another_app_products",
        hook_name: "another_app_validate",
        label: "Product Save Webhook",
        webhook_method: "observer.catalog_product_save_after",
        webhook_type: "after",
      }),
    );
  });

  test("returns [] for webhooks with category other than modification", async () => {
    const config = createMockWebhooksConfig({
      webhooks: [
        createMockUrlWebhookEntry({
          category: "append",
          description: "Append webhook",
          label: "Append Webhook",
          webhook: {
            batch_name: "default",
            hook_name: "order_created",
            webhook_method: "plugin.order.api.order_created",
          },
        }),
        createMockUrlWebhookEntry({
          category: undefined,
          description: "No category webhook",
          label: "No Category Webhook",
          webhook: {
            batch_name: "default2",
            hook_name: "order_created2",
            url: "https://example.com/hook2",
            webhook_method: "plugin.order.api.order_created",
          },
        }),
      ],
    });

    const conflictingWebhook = createMockExistingCommerceWebhook({
      batch_name: "other_app_batch",
      hook_name: "other_app_hook",
    });
    const getWebhookList = vi.fn().mockResolvedValue([conflictingWebhook]);
    const context = makeContext(vi.fn(), getWebhookList);

    await expect(validateWebhookConflicts(config, context)).resolves.toEqual(
      [],
    );
    expect(getWebhookList).not.toHaveBeenCalled();
  });

  test("ignores modification webhooks scoped to a different environment", async () => {
    const getWebhookList = vi.fn().mockResolvedValue([]);
    const context = makeContext(vi.fn(), getWebhookList, {
      ...DEFAULT_PARAMS,
      AIO_COMMERCE_API_FLAVOR: "saas",
    });

    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          category: "modification",
          env: ["paas"],
          label: "PaaS only modification",
        }),
      ],
    });

    await expect(validateWebhookConflicts(config, context)).resolves.toEqual(
      [],
    );
    expect(getWebhookList).not.toHaveBeenCalled();
  });
});

/** Minimal valid IMS params shared across resolveDeveloperConsoleOAuthCredentials tests. */
const BASE_IMS_PARAMS = createMockInstallationParams({
  AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
  AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
  AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "tech-account-id",
});

describe("resolveDeveloperConsoleOAuthCredentials", () => {
  test("returns credentials object when all values are present (string secret)", () => {
    const result = resolveDeveloperConsoleOAuthCredentials(BASE_IMS_PARAMS);

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      environment: "production",
      org_id: "org-id",
    });
  });

  test("returns credentials object using first element when secrets is a real array", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: [
        "primary-secret",
        "secondary-secret",
      ],
    });

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "primary-secret",
      environment: "production",
      org_id: "org-id",
    });
  });

  test("returns credentials using first element when secrets is a JSON-stringified array", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS:
        '["primary-secret","secondary-secret"]',
    });

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "primary-secret",
      environment: "production",
      org_id: "org-id",
    });
  });

  test("sets environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT starts with prod", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "prod",
    });

    expect(result.environment).toBe("production");
  });

  test("sets environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is production", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "production",
    });

    expect(result.environment).toBe("production");
  });

  test("sets environment to staging when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT does not start with prod", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "stage",
    });

    expect(result.environment).toBe("staging");
  });

  test("defaults environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is absent", () => {
    const result = resolveDeveloperConsoleOAuthCredentials(BASE_IMS_PARAMS);

    expect(result.environment).toBe("production");
  });

  test("defaults environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is empty", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "",
    });

    expect(result.environment).toBe("production");
  });

  test("throws when one of the IMS credential fields is empty", () => {
    expect(() =>
      resolveDeveloperConsoleOAuthCredentials({
        ...BASE_IMS_PARAMS,
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "",
      }),
    ).toThrow(Error);
  });
});

describe("deleteWebhookSubscriptions", () => {
  test("calls unsubscribeWebhook for each configured webhook that exists in the list", async () => {
    const unsubscribeWebhook = vi.fn().mockResolvedValue(null);
    // configWithWebhooks metadata.id = "test-app-webhooks" → prefix "test_app_webhooks_"
    // The first (and only) webhook has batch_name "default" and hook_name "order_created"
    const existingWebhook = {
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
    };
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    const context = makeContext(
      vi.fn(),
      getWebhookList,
      DEFAULT_PARAMS,
      unsubscribeWebhook,
    );

    const result = await deleteWebhookSubscriptions(
      configWithWebhooks,
      context,
    );

    expect(unsubscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
        webhook_method: "plugin.order.api.order_created",
        webhook_type: "after",
      }),
    );
    expect(result.unsubscribedWebhooks).toHaveLength(1);
  });

  test("does not filter by environment (offboards items scoped to other environments)", async () => {
    const unsubscribeWebhook = vi.fn().mockResolvedValue(null);
    const existingWebhook = createMockExistingCommerceWebhook();
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    // Install ran against "saas" but the webhook is scoped to "paas"; uninstall must
    // still offboard it (offboarding is environment-agnostic and idempotent).
    const context = makeContext(
      vi.fn(),
      getWebhookList,
      { ...DEFAULT_PARAMS, AIO_COMMERCE_API_FLAVOR: "saas" },
      unsubscribeWebhook,
    );

    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          category: "modification",
          env: ["paas"],
          label: "PaaS only",
        }),
      ],
    });

    const result = await deleteWebhookSubscriptions(config, context);

    expect(unsubscribeWebhook).toHaveBeenCalledTimes(1);
    expect(result.unsubscribedWebhooks).toHaveLength(1);
  });

  test("skips silently if a webhook is not found in the list (idempotent)", async () => {
    const unsubscribeWebhook = vi.fn().mockResolvedValue(null);
    const getWebhookList = vi.fn().mockResolvedValue([]);
    const context = makeContext(
      vi.fn(),
      getWebhookList,
      DEFAULT_PARAMS,
      unsubscribeWebhook,
    );

    const result = await deleteWebhookSubscriptions(
      configWithWebhooks,
      context,
    );

    expect(unsubscribeWebhook).not.toHaveBeenCalled();
    expect(result.unsubscribedWebhooks).toHaveLength(0);
  });

  test("returns only the webhooks that were actually unsubscribed", async () => {
    const unsubscribeWebhook = vi.fn().mockResolvedValue(null);

    const twoWebhookConfig = {
      ...configWithWebhooks,
      webhooks: [
        {
          category: "modification" as const,
          description: "First webhook",
          label: "First Webhook",
          runtimeAction: "my-package/handle-first",
          webhook: {
            batch_name: "default",
            hook_name: "order_created",
            method: "POST",
            url: "https://example.com/first",
            webhook_method: "plugin.order.api.order_created",
            webhook_type: "after",
          },
        },
        {
          category: "modification" as const,
          description: "Second webhook",
          label: "Second Webhook",
          runtimeAction: "my-package/handle-second",
          webhook: {
            batch_name: "products",
            hook_name: "validate",
            method: "POST",
            url: "https://example.com/second",
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
          },
        },
      ],
    };

    // Only the first webhook exists in Commerce
    const existingWebhook = {
      batch_name: "test_app_webhooks_default",
      hook_name: "test_app_webhooks_order_created",
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
    };
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    const context = makeContext(
      vi.fn(),
      getWebhookList,
      DEFAULT_PARAMS,
      unsubscribeWebhook,
    );

    const result = await deleteWebhookSubscriptions(twoWebhookConfig, context);

    expect(unsubscribeWebhook).toHaveBeenCalledTimes(1);
    expect(unsubscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_name: "test_app_webhooks_default",
        hook_name: "test_app_webhooks_order_created",
        webhook_method: "plugin.order.api.order_created",
      }),
    );
    expect(result.unsubscribedWebhooks).toHaveLength(1);
  });

  test("prepends sanitized metadata.id prefix to batch_name and hook_name", async () => {
    const unsubscribeWebhook = vi.fn().mockResolvedValue(null);

    const config = {
      metadata: {
        description: "d",
        displayName: "My App",
        id: "my--app.v2",
        version: "1.0.0",
      },
      webhooks: [
        {
          category: "modification" as const,
          description: "Test webhook",
          label: "Test Webhook",
          runtimeAction: "my-package/handle-webhook",
          webhook: {
            batch_name: "products",
            hook_name: "validate",
            method: "POST",
            url: "https://example.com/hook",
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "after",
          },
        },
      ],
    };

    const existingWebhook = {
      batch_name: "my_app_v2_products",
      hook_name: "my_app_v2_validate",
      webhook_method: "observer.catalog_product_save_after",
      webhook_type: "after",
    };
    const getWebhookList = vi.fn().mockResolvedValue([existingWebhook]);
    const context = makeContext(
      vi.fn(),
      getWebhookList,
      DEFAULT_PARAMS,
      unsubscribeWebhook,
    );

    await deleteWebhookSubscriptions(config, context);

    expect(unsubscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_name: "my_app_v2_products",
        hook_name: "my_app_v2_validate",
      }),
    );
  });

  test("should log a warning and continue when unsubscribe throws", async () => {
    const resolvedBatch = "test_app_webhooks_batch";
    const resolvedHook = "test_app_webhooks_hook";
    const existingWebhook = createMockExistingCommerceWebhook({
      batch_name: resolvedBatch,
      hook_name: resolvedHook,
      webhook_method: "observer.catalog_product_save_after",
      webhook_type: "before",
    });

    const unsubscribeError = new Error("Commerce API unavailable");
    const unsubscribeWebhookFn = vi.fn().mockRejectedValue(unsubscribeError);
    const getWebhookListFn = vi.fn().mockResolvedValue([existingWebhook]);
    const ctx = makeContext(
      vi.fn(),
      getWebhookListFn,
      DEFAULT_PARAMS,
      unsubscribeWebhookFn,
    );

    const config = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "batch",
            hook_name: "hook",
            webhook_method: "observer.catalog_product_save_after",
            webhook_type: "before",
          },
        }),
      ],
    });

    // Should NOT throw, and should return empty unsubscribed list
    const result = await deleteWebhookSubscriptions(config, ctx);
    expect(result.unsubscribedWebhooks).toHaveLength(0);
    expect(ctx.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete webhook subscription for "'),
    );
    expect(ctx.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Commerce API unavailable"),
    );
  });
});

describe("buildWebhookIdPrefix", () => {
  test.each([
    [
      "should append a trailing underscore to a clean lowercase id",
      "my-app",
      "my_app_",
    ],
    ["should lowercase an uppercase id", "MyApp", "myapp_"],
    ["should lowercase a mixed-case id", "MyMixedApp", "mymixedapp_"],
    [
      "should replace non-identifier characters with underscores",
      "my--app.v2",
      "my_app_v2_",
    ],
    [
      "should lowercase and replace non-identifier characters",
      "My--App.V2",
      "my_app_v2_",
    ],
    [
      "should preserve a trailing underscore without doubling it",
      "my-app-",
      "my_app_",
    ],
  ] as const)("%s", (_desc, appId, expected) => {
    expect(buildWebhookIdPrefix(appId)).toBe(expected);
  });
});
