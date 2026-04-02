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

import { createMockInstallationContext } from "./installation";

import type { WebhooksExecutionContext } from "#management/installation/webhooks/context";

/** Creates a mock WebhooksExecutionContext for testing. */
export function createMockWebhooksContext(
  subscribeWebhookFn = vi.fn().mockResolvedValue(null),
  getWebhookListFn = vi.fn().mockResolvedValue([]),
  unsubscribeWebhookFn = vi.fn().mockResolvedValue(null),
): WebhooksExecutionContext {
  const mockInstallation = createMockInstallationContext({
    params: {
      AIO_COMMERCE_API_BASE_URL: "https://api.commerce.adobe.com",
      AIO_COMMERCE_API_FLAVOR: "saas",
      AIO_COMMERCE_AUTH_IMS_TOKEN: "test-ims-token",
      AIO_COMMERCE_AUTH_IMS_API_KEY: "test-api-key",
      // biome-ignore lint/suspicious/noExplicitAny: mocking the params
    } as any,
  });

  return {
    ...mockInstallation,
    commerceWebhooksClient: {
      getWebhookList: getWebhookListFn,
      subscribeWebhook: subscribeWebhookFn,
      unsubscribeWebhook: unsubscribeWebhookFn,
    },
  } as unknown as WebhooksExecutionContext;
}
