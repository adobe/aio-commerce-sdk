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

import { vi } from "vitest";

import { configWithWebhooks, createMockMetadata } from "./config";
import {
  createMockInstallationContext,
  createMockLogger,
  DEFAULT_INSTALLATION_PARAMS,
} from "./installation";

import type {
  CommerceWebhook,
  WebhookSubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhookDefinition, WebhookEntry } from "#config/schema/webhooks";
import type { WebhooksExecutionContext } from "#management/installation/webhooks/context";

export function createMockWebhookDefinition(
  overrides: Partial<WebhookDefinition> = {
    method: "POST",
  },
): WebhookDefinition {
  return {
    ...configWithWebhooks.webhooks[0].webhook,
    ...overrides,
  };
}

type RuntimeWebhookEntry = Extract<WebhookEntry, { runtimeAction: string }>;
type UrlWebhookEntry = Exclude<WebhookEntry, { runtimeAction: string }>;
type UrlWebhookDefinition = Extract<WebhookDefinition, { url: string }>;

type RuntimeWebhookEntryOverrides = Omit<
  Partial<RuntimeWebhookEntry>,
  "webhook"
> & {
  webhook?: Partial<WebhookDefinition>;
};

type UrlWebhookEntryOverrides = Omit<Partial<UrlWebhookEntry>, "webhook"> & {
  webhook?: Partial<UrlWebhookDefinition>;
};

export function createMockRuntimeWebhookEntry(
  overrides: RuntimeWebhookEntryOverrides = {
    category: "modification",
  },
): RuntimeWebhookEntry {
  const defaultEntry = configWithWebhooks.webhooks[0] as RuntimeWebhookEntry;
  return {
    ...defaultEntry,
    ...overrides,
    webhook: createMockWebhookDefinition(overrides.webhook ?? {}),
  };
}

/** Runtime webhook entry scoped to the PaaS environment (app-config env-filter tests). */
export function createMockPaasWebhookEntry(): RuntimeWebhookEntry {
  return createMockRuntimeWebhookEntry({
    description: "PaaS-only webhook",
    env: ["paas"],
    label: "PaaS only",
    runtimeAction: "my-package/paas",
  });
}

/** Runtime webhook entry that applies to all environments (no `env`). */
export function createMockAllEnvsWebhookEntry(): RuntimeWebhookEntry {
  return createMockRuntimeWebhookEntry({
    description: "Webhook for all environments",
    label: "All envs",
    runtimeAction: "my-package/all",
  });
}

export function createMockUrlWebhookEntry(
  overrides: UrlWebhookEntryOverrides = {
    category: "modification",
  },
): UrlWebhookEntry {
  const { webhook: _ignoredWebhookOverride, ...entryOverrides } = overrides;
  const webhookOverrides = overrides.webhook ?? {};
  const webhook: UrlWebhookDefinition = {
    ...configWithWebhooks.webhooks[0].webhook,
    ...webhookOverrides,
    url: webhookOverrides.url ?? "https://example.com/hook",
  };

  return {
    category: "modification",
    description: "Test webhook",
    label: "Test Webhook",
    ...entryOverrides,
    webhook,
  };
}

export function createMockWebhooksConfig({
  metadata,
  webhooks,
}: {
  metadata?: Partial<ReturnType<typeof createMockMetadata>>;
  webhooks?: WebhookEntry[];
} = {}) {
  return {
    ...configWithWebhooks,
    metadata: createMockMetadata("test-app-webhooks", metadata),
    webhooks: webhooks ?? configWithWebhooks.webhooks,
  };
}

export function createMockResolvedWebhook(
  overrides: Partial<WebhookSubscribeParams> = {},
): WebhookSubscribeParams {
  return {
    batch_name: "my_app_batch",
    hook_name: "my_app_hook",
    method: "POST",
    url: "https://example.com/hook",
    webhook_method: "observer.catalog_product_save_after",
    webhook_type: "after",
    ...overrides,
  };
}

export function createMockExistingCommerceWebhook(
  overrides: Partial<CommerceWebhook> = {},
): CommerceWebhook {
  return {
    batch_name: "test_app_webhooks_default",
    hook_name: "test_app_webhooks_order_created",
    url: "https://example.com/hook",
    webhook_method: "plugin.order.api.order_created",
    webhook_type: "after",
    ...overrides,
  };
}

export function createMockCommerceWebhooksClient({
  subscribeWebhook = vi.fn().mockResolvedValue(null),
  getWebhookList = vi.fn().mockResolvedValue([]),
  unsubscribeWebhook = vi.fn().mockResolvedValue(null),
}: Partial<
  WebhooksExecutionContext["commerceWebhooksClient"]
> = {}): WebhooksExecutionContext["commerceWebhooksClient"] {
  return {
    getWebhookList,
    subscribeWebhook,
    unsubscribeWebhook,
  };
}

export function createMockResolvedCommerceHttpClientParams(
  overrides: { baseUrl?: string; fetchOptions?: Record<string, unknown> } = {},
) {
  return {
    baseUrl: DEFAULT_INSTALLATION_PARAMS.AIO_COMMERCE_API_BASE_URL,
    ...overrides,
  };
}

/** Creates a mock WebhooksExecutionContext for testing. */
export function createMockWebhooksContext(
  subscribeWebhookFn: WebhooksExecutionContext["commerceWebhooksClient"]["subscribeWebhook"] = vi
    .fn()
    .mockResolvedValue(null),
  getWebhookListFn: WebhooksExecutionContext["commerceWebhooksClient"]["getWebhookList"] = vi
    .fn()
    .mockResolvedValue([]),
  params: Partial<WebhooksExecutionContext["params"]> = {},
  unsubscribeWebhookFn: WebhooksExecutionContext["commerceWebhooksClient"]["unsubscribeWebhook"] = vi
    .fn()
    .mockResolvedValue(null),
): WebhooksExecutionContext {
  const mockInstallation = createMockInstallationContext({
    logger: createMockLogger(),
    params,
  });

  return {
    ...mockInstallation,
    commerceWebhooksClient: createMockCommerceWebhooksClient({
      getWebhookList: getWebhookListFn,
      subscribeWebhook: subscribeWebhookFn,
      unsubscribeWebhook: unsubscribeWebhookFn,
    }),
  };
}
