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

import { resolveCommerceHttpClientParams } from "#lib/commerce/helpers";

describe("lib/commerce/helpers", () => {
  describe("resolveCommerceHttpClientParams", () => {
    test("should resolve SaaS Commerce params with IMS auth", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "https://api.commerce.adobe.com/my-tenant/",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveCommerceHttpClientParams(params);

      expect(result.config.flavor).toBe("saas");
      expect(result.config.baseUrl).toBe(
        "https://api.commerce.adobe.com/my-tenant/",
      );
      expect(result.auth).toMatchObject({
        clientId: "test-client-id",
      });
    });

    test("should resolve SaaS Commerce params with subdomain", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL:
          "https://my-env.api.commerce.adobe.com/my-tenant",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveCommerceHttpClientParams(params);

      expect(result.config.flavor).toBe("saas");
      expect(result.config.baseUrl).toBe(
        "https://my-env.api.commerce.adobe.com/my-tenant",
      );
    });

    test("should resolve PaaS Commerce params with Integration auth", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "https://my-store.example.com/",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const result = resolveCommerceHttpClientParams(params);

      expect(result.config.flavor).toBe("paas");
      expect(result.config.baseUrl).toBe("https://my-store.example.com/");
      expect(result.auth).toMatchObject({
        consumerKey: "test-consumer-key",
      });
    });

    test("should resolve PaaS Commerce params with IMS auth", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "https://my-store.example.com/",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const result = resolveCommerceHttpClientParams(params);

      expect(result.config.flavor).toBe("paas");
      expect(result.config.baseUrl).toBe("https://my-store.example.com/");
      expect(result.auth).toMatchObject({
        clientId: "test-client-id",
      });
    });

    test("should resolve PaaS Commerce params with custom domain", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "https://commerce.mycompany.com/api",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const result = resolveCommerceHttpClientParams(params);

      expect(result.config.flavor).toBe("paas");
      expect(result.config.baseUrl).toBe("https://commerce.mycompany.com/api");
    });

    test("should throw error when AIO_COMMERCE_API_BASE_URL is missing", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      expect(() => {
        resolveCommerceHttpClientParams(params);
      }).toThrow(
        "Can not resolve CommerceHttpClientParams without an AIO_COMMERCE_API_BASE_URL",
      );
    });

    test("should throw error when AIO_COMMERCE_API_BASE_URL is empty", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      expect(() => {
        resolveCommerceHttpClientParams(params);
      }).toThrow(
        "Can not resolve CommerceHttpClientParams without an AIO_COMMERCE_API_BASE_URL",
      );
    });

    test("should throw error when auth params are missing for SaaS", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "https://api.commerce.adobe.com/my-tenant/",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        // Missing other required IMS fields
      };

      expect(() => {
        resolveCommerceHttpClientParams(params);
      }).toThrow("Can't resolve authentication options for the given params");
    });

    test("should throw validation error when auth params are missing for PaaS", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "https://my-store.example.com/",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        // Missing other required Integration fields
      };

      expect(() => {
        resolveCommerceHttpClientParams(params);
      }).toThrow();
    });

    test("should throw error when SaaS is detected with Integration auth", () => {
      const params = {
        AIO_COMMERCE_API_BASE_URL: "https://api.commerce.adobe.com/my-tenant/",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      expect(() => {
        resolveCommerceHttpClientParams(params);
      }).toThrow(
        "Resolved incorrect auth parameters for SaaS. Only IMS auth is supported",
      );
    });
  });
});
