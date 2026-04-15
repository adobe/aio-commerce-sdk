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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockInstallationContext } from "#test/fixtures/installation";
import {
  createMockCommerceWebhooksClient,
  createMockResolvedCommerceHttpClientParams,
} from "#test/fixtures/webhooks";

describe("createWebhooksStepContext", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test("lazily creates the Commerce Webhooks client once", async () => {
    const resolvedParams = createMockResolvedCommerceHttpClientParams();
    const createdClient = createMockCommerceWebhooksClient();

    const resolveCommerceHttpClientParams = vi
      .fn()
      .mockReturnValue(resolvedParams);

    const createCustomCommerceWebhooksApiClient = vi
      .fn()
      .mockReturnValue(createdClient);

    const getWebhookList = vi.fn();
    const subscribeWebhook = vi.fn();
    const unsubscribeWebhook = vi.fn();

    vi.doMock("@adobe/aio-commerce-lib-api", () => ({
      resolveCommerceHttpClientParams,
    }));

    vi.doMock("@adobe/aio-commerce-lib-webhooks/api", () => ({
      createCustomCommerceWebhooksApiClient,
      getWebhookList,
      subscribeWebhook,
      unsubscribeWebhook,
    }));

    const { createWebhooksStepContext } = await import(
      "#management/installation/webhooks/context"
    );

    const installation = createMockInstallationContext();
    const context = createWebhooksStepContext(installation);

    const firstClient = context.commerceWebhooksClient;
    const secondClient = context.commerceWebhooksClient;

    expect(resolveCommerceHttpClientParams).toHaveBeenCalledWith(
      installation.params,
      { tryForwardAuthProvider: true },
    );

    expect(createCustomCommerceWebhooksApiClient).toHaveBeenCalledWith(
      {
        ...resolvedParams,
        fetchOptions: expect.anything(),
      },
      {
        getWebhookList,
        subscribeWebhook,
        unsubscribeWebhook,
      },
    );

    expect(firstClient).toBe(createdClient);
    expect(secondClient).toBe(createdClient);
    expect(createCustomCommerceWebhooksApiClient).toHaveBeenCalledTimes(1);
  });
});
