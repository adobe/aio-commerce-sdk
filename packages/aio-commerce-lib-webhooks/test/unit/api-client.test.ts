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

import { describe, expect, test } from "vitest";

import {
  createCommerceWebhooksApiClient,
  createCustomCommerceWebhooksApiClient,
  getWebhookList,
  subscribeWebhook,
} from "../../source/index.js";
import {
  TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
  TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS,
} from "../fixtures/http-client-params.js";

describe("Commerce Webhooks API client", () => {
  describe("createCommerceWebhooksApiClient", () => {
    test("should create a client with all webhook endpoints (PaaS)", () => {
      const client = createCommerceWebhooksApiClient(
        TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
      );

      expect(client).toHaveProperty("getWebhookList");
      expect(client).toHaveProperty("subscribeWebhook");
      expect(client).toHaveProperty("unsubscribeWebhook");
      expect(client).toHaveProperty("getSupportedWebhookList");
    });

    test("should create a client with all webhook endpoints (SaaS)", () => {
      const client = createCommerceWebhooksApiClient(
        TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS,
      );

      expect(client).toHaveProperty("getWebhookList");
      expect(client).toHaveProperty("subscribeWebhook");
      expect(client).toHaveProperty("unsubscribeWebhook");
      expect(client).toHaveProperty("getSupportedWebhookList");
    });
  });

  describe("createCustomCommerceWebhooksApiClient", () => {
    test("should create a client with only specified endpoints", () => {
      const client = createCustomCommerceWebhooksApiClient(
        TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
        { getWebhookList, subscribeWebhook },
      );

      expect(client).toHaveProperty("getWebhookList");
      expect(client).toHaveProperty("subscribeWebhook");

      expect(client).not.toHaveProperty("unsubscribeWebhook");
      expect(client).not.toHaveProperty("getSupportedWebhookList");
    });
  });
});
