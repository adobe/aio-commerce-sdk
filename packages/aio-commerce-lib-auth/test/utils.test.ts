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

import { resolveAuthParams } from "#lib/utils";

describe("aio-commerce-lib-auth/utils", () => {
  describe("resolveAuthParams", () => {
    test("should auto-detect and resolve forwarded IMS auth when token param is provided", () => {
      const params = {
        AIO_COMMERCE_IMS_AUTH_TOKEN: "forwarded-token",
        AIO_COMMERCE_IMS_AUTH_API_KEY: "forwarded-api-key",
      };

      const resolved = resolveAuthParams(params);

      expect(resolved.strategy).toBe("ims");
      expect(resolved.getAccessToken()).toBe("forwarded-token");
      expect(resolved.getHeaders()).toEqual({
        Authorization: "Bearer forwarded-token",
        "x-api-key": "forwarded-api-key",
      });
    });

    test("should auto-detect forwarded IMS auth with only token (no api key)", () => {
      const params = {
        AIO_COMMERCE_IMS_AUTH_TOKEN: "forwarded-token",
      };

      const resolved = resolveAuthParams(params);

      expect(resolved.strategy).toBe("ims");
      expect(resolved.getAccessToken()).toBe("forwarded-token");
      expect(resolved.getHeaders()).toEqual({
        Authorization: "Bearer forwarded-token",
      });
    });

    test("should prioritize full IMS params over forwarded IMS auth", () => {
      const params = {
        AIO_COMMERCE_IMS_AUTH_TOKEN: "forwarded-token",
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const resolved = resolveAuthParams(params);

      expect(resolved.strategy).toBe("ims");
      // Should use full IMS params, not forwarded token
      expect(resolved).toHaveProperty("clientId", "test-client-id");
    });

    test("should auto-detect and resolve IMS auth params when IMS params are provided", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const resolved = resolveAuthParams(params);

      expect(resolved).toEqual({
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: undefined,
        context: undefined,
        strategy: "ims",
      });
    });

    test("should auto-detect and resolve Integration auth params when Integration params are provided", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const resolved = resolveAuthParams(params);

      expect(resolved).toEqual({
        consumerKey: "test-consumer-key",
        consumerSecret: "test-consumer-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
        strategy: "integration",
      });
    });

    test("should prioritize Integration auth over forwarded IMS auth", () => {
      const params = {
        AIO_COMMERCE_IMS_AUTH_TOKEN: "forwarded-token",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const resolved = resolveAuthParams(params);

      expect(resolved.strategy).toBe("integration");
      expect(resolved).toHaveProperty("consumerKey", "test-consumer-key");
    });

    test("should prioritize IMS auth when both IMS and Integration params are provided", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const resolved = resolveAuthParams(params);

      expect(resolved.strategy).toBe("ims");
      expect(resolved).toHaveProperty("clientId", "test-client-id");
    });

    test("resolution order: full IMS > Integration > forwarded IMS", () => {
      // All three auth types present
      const params = {
        // Forwarded IMS
        AIO_COMMERCE_IMS_AUTH_TOKEN: "forwarded-token",
        // Full IMS
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
        // Integration
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const resolved = resolveAuthParams(params);

      // Full IMS takes priority over everything
      expect(resolved.strategy).toBe("ims");
      expect(resolved).toHaveProperty("clientId", "test-client-id");
      expect(resolved).not.toHaveProperty("getAccessToken");
    });

    test("should throw error when neither IMS nor Integration params are provided", () => {
      const params = {};
      expect(() => {
        resolveAuthParams(params);
      }).toThrow("Can't resolve authentication options for the given params");
    });

    test("should throw error when IMS params are incomplete", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        // Missing other required IMS fields
      };

      expect(() => {
        resolveAuthParams(params);
      }).toThrow("Can't resolve authentication options for the given params");
    });

    test("should throw error when Integration params are incomplete", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        // Missing other required Integration fields
      };

      expect(() => {
        resolveAuthParams(params);
      }).toThrow("Can't resolve authentication options for the given params");
    });
  });
});
