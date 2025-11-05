/*
 * Copyright 2025 Adobe. All rights reserved.
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

import { resolveIoEventsHttpClientParams } from "#lib/io-events/helpers";

describe("lib/io-events/helpers", () => {
  describe("resolveIoEventsHttpClientParams", () => {
    test("should resolve IO Events params with IMS auth and default base URL", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveIoEventsHttpClientParams(params);

      expect(result.auth).toMatchObject({
        clientId: "test-client-id",
      });
      expect(result.config?.baseUrl).toBeUndefined();
    });

    test("should resolve IO Events params with custom base URL", () => {
      const params = {
        AIO_EVENTS_API_BASE_URL: "https://custom-events.adobe.io",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveIoEventsHttpClientParams(params);

      expect(result.auth).toMatchObject({
        clientId: "test-client-id",
      });
      expect(result.config?.baseUrl).toBe("https://custom-events.adobe.io");
    });

    test("should resolve IO Events params with all optional IMS fields", () => {
      const params = {
        AIO_EVENTS_API_BASE_URL: "https://events.adobe.io",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
        AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "prod",
        AIO_COMMERCE_AUTH_IMS_CONTEXT: "test-context",
      };

      const result = resolveIoEventsHttpClientParams(params);

      expect(result.auth).toMatchObject({
        clientId: "test-client-id",
        environment: "prod",
        context: "test-context",
      });
      expect(result.config?.baseUrl).toBe("https://events.adobe.io");
    });

    test("should throw error when IMS auth params are missing", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        // Missing other required IMS fields
      };

      expect(() => {
        resolveIoEventsHttpClientParams(params);
      }).toThrow("Can't resolve authentication options for the given params");
    });

    test("should throw error when all params are empty", () => {
      const params = {};

      expect(() => {
        resolveIoEventsHttpClientParams(params);
      }).toThrow("Can't resolve authentication options for the given params");
    });

    test("should handle empty string base URL correctly", () => {
      const params = {
        AIO_EVENTS_API_BASE_URL: "",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveIoEventsHttpClientParams(params);

      // Empty string is falsy, so baseUrl should be undefined
      expect(result.config?.baseUrl).toBeUndefined();
    });
  });
});
