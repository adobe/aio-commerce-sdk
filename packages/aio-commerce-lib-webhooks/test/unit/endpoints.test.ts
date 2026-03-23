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

import {
  getSupportedWebhookList,
  getWebhookList,
  subscribeWebhook,
  unsubscribeWebhook,
} from "#api/index";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";

function makeHttpClient(jsonResponse: unknown = null) {
  const jsonFn = vi.fn().mockResolvedValue(jsonResponse);
  const getMock = vi.fn().mockReturnValue({ json: jsonFn });
  const postMock = vi.fn().mockReturnValue({ json: jsonFn });

  const client = {
    get: getMock,
    post: postMock,
  } as unknown as AdobeCommerceHttpClient;

  return { client, getMock, postMock, jsonFn };
}

const VALID_SUBSCRIBE_PARAMS = {
  webhook_method: "observer.catalog_product_save_after",
  webhook_type: "after",
  batch_name: "my_batch",
  hook_name: "my_hook",
  url: "https://example.com/webhook",
};

describe("Webhook endpoints", () => {
  describe("getWebhookList", () => {
    test("calls GET webhooks/list", async () => {
      const { client, getMock } = makeHttpClient([]);
      await getWebhookList(client);
      expect(getMock).toHaveBeenCalledWith("webhooks/list", undefined);
    });

    test("returns the parsed response", async () => {
      const payload = [
        {
          webhook_method: "observer.catalog_product_save_after",
          webhook_type: "after",
          batch_name: "my_batch",
          hook_name: "my_hook",
          url: "https://example.com/webhook",
        },
      ];
      const { client } = makeHttpClient(payload);
      const result = await getWebhookList(client);
      expect(result).toEqual(payload);
    });

    test("forwards fetchOptions", async () => {
      const { client, getMock } = makeHttpClient([]);
      const opts = { headers: { "x-custom": "value" } };
      await getWebhookList(client, opts);
      expect(getMock).toHaveBeenCalledWith("webhooks/list", opts);
    });
  });

  describe("subscribeWebhook", () => {
    test("calls POST webhooks/subscribe with { webhook: params }", async () => {
      const { client, postMock } = makeHttpClient(null);
      await subscribeWebhook(client, VALID_SUBSCRIBE_PARAMS);
      expect(postMock).toHaveBeenCalledWith(
        "webhooks/subscribe",
        expect.objectContaining({ json: { webhook: VALID_SUBSCRIBE_PARAMS } }),
      );
    });

    test("throws on invalid params (missing required field)", () => {
      const { client } = makeHttpClient(null);
      expect(() =>
        subscribeWebhook(client, {
          // missing webhook_type, batch_name, hook_name, url
          webhook_method: "observer.catalog_product_save_after",
        } as Parameters<typeof subscribeWebhook>[1]),
      ).toThrow();
    });

    test("includes optional fields in the request body when provided", async () => {
      const { client, postMock } = makeHttpClient(null);
      const params = {
        ...VALID_SUBSCRIBE_PARAMS,
        priority: 10,
        required: true,
        method: "POST",
        fields: [{ name: "sku" }],
      };
      await subscribeWebhook(client, params);
      expect(postMock).toHaveBeenCalledWith(
        "webhooks/subscribe",
        expect.objectContaining({ json: { webhook: params } }),
      );
    });
  });

  describe("unsubscribeWebhook", () => {
    const VALID_UNSUBSCRIBE_PARAMS = {
      webhook_method: "observer.catalog_product_save_after",
      webhook_type: "after",
      batch_name: "my_batch",
      hook_name: "my_hook",
    };

    test("calls POST webhooks/unsubscribe with { webhook: params }", async () => {
      const { client, postMock } = makeHttpClient(null);
      await unsubscribeWebhook(client, VALID_UNSUBSCRIBE_PARAMS);
      expect(postMock).toHaveBeenCalledWith(
        "webhooks/unsubscribe",
        expect.objectContaining({
          json: { webhook: VALID_UNSUBSCRIBE_PARAMS },
        }),
      );
    });

    test("throws on invalid params (missing hook_name)", () => {
      const { client } = makeHttpClient(null);
      expect(() =>
        unsubscribeWebhook(client, {
          webhook_method: "observer.catalog_product_save_after",
          webhook_type: "after",
          batch_name: "my_batch",
          // missing hook_name
        } as Parameters<typeof unsubscribeWebhook>[1]),
      ).toThrow();
    });
  });

  describe("getSupportedWebhookList", () => {
    test("calls GET webhooks/supportedList", async () => {
      const { client, getMock } = makeHttpClient([]);
      await getSupportedWebhookList(client);
      expect(getMock).toHaveBeenCalledWith("webhooks/supportedList", undefined);
    });

    test("returns the parsed response", async () => {
      const payload = [{ name: "observer.catalog_product_save_after" }];
      const { client } = makeHttpClient(payload);
      const result = await getSupportedWebhookList(client);
      expect(result).toEqual(payload);
    });
  });
});
