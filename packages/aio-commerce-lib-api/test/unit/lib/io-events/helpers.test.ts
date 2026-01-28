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

import type { ImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

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

    test("should resolve IO Events params with forwarded IMS auth token when tryForwardAuthProvider is true", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_TOKEN: "forwarded-token",
        AIO_COMMERCE_AUTH_IMS_API_KEY: "forwarded-api-key",
      };

      const result = resolveIoEventsHttpClientParams(params, {
        tryForwardAuthProvider: true,
      });

      // Auth should be an ImsAuthProvider (has getAccessToken and getHeaders)
      expect(result.auth).toHaveProperty("getAccessToken");
      expect(result.auth).toHaveProperty("getHeaders");
    });

    test("should resolve IO Events params with forwarded IMS auth token and custom base URL", () => {
      const params = {
        AIO_EVENTS_API_BASE_URL: "https://custom-events.adobe.io",
        AIO_COMMERCE_AUTH_IMS_TOKEN: "forwarded-token",
      };

      const result = resolveIoEventsHttpClientParams(params, {
        tryForwardAuthProvider: true,
      });

      expect(result.auth).toHaveProperty("getAccessToken");
      expect(result.config?.baseUrl).toBe("https://custom-events.adobe.io");
    });

    test("should use forwarded IMS auth when tryForwardAuthProvider is true even with full IMS params", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_TOKEN: "forwarded-token",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveIoEventsHttpClientParams(params, {
        tryForwardAuthProvider: true,
      });

      // Should use forwarded token (ImsAuthProvider), not full IMS params
      expect(result.auth).toHaveProperty("getAccessToken");
      expect(result.auth).not.toHaveProperty("clientId");
    });

    test("should use full IMS params by default even when forwarded token is present", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_TOKEN: "forwarded-token",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveIoEventsHttpClientParams(params);

      // Should use full IMS params, not forwarded token
      expect(result.auth).toHaveProperty("clientId", "test-client-id");
      expect(result.auth).not.toHaveProperty("getAccessToken");
    });

    test("forwarded IMS auth provider should return correct token and headers", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_TOKEN: "my-forwarded-token",
        AIO_COMMERCE_AUTH_IMS_API_KEY: "my-api-key",
      };

      const result = resolveIoEventsHttpClientParams(params, {
        tryForwardAuthProvider: true,
      });
      const auth = result.auth as ImsAuthProvider;

      expect(auth.getAccessToken()).toBe("my-forwarded-token");
      expect(auth.getHeaders()).toEqual({
        Authorization: "Bearer my-forwarded-token",
        "x-api-key": "my-api-key",
      });
    });

    test("forwarded IMS auth provider should work without API key", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_TOKEN: "my-forwarded-token",
      };

      const result = resolveIoEventsHttpClientParams(params, {
        tryForwardAuthProvider: true,
      });
      const auth = result.auth as ImsAuthProvider;

      expect(auth.getAccessToken()).toBe("my-forwarded-token");
      expect(auth.getHeaders()).toEqual({
        Authorization: "Bearer my-forwarded-token",
      });
    });

    test("should throw error when Integration auth is used", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      expect(() => {
        resolveIoEventsHttpClientParams(params);
      }).toThrow(
        "Resolved incorrect auth parameters for I/O Events. Only IMS auth is supported",
      );
    });
  });
});
