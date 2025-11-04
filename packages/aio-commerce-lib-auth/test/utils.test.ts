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

import { resolveAuthParams } from "~/lib/utils";

describe("aio-commerce-lib-auth/utils", () => {
  describe("resolveAuthParams with auto strategy", () => {
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

  describe("resolveAuthParams with explicit ims strategy", () => {
    test("should resolve IMS auth params when strategy is ims", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const resolved = resolveAuthParams(params, "ims");

      expect(resolved).toEqual({
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: undefined,
        context: undefined,
      });
    });

    test("should throw when strategy is ims but params are invalid", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        // Missing other required fields
      };

      expect(() => {
        resolveAuthParams(params, "ims");
      }).toThrow("Invalid ImsAuthProvider configuration");
    });
  });

  describe("resolveAuthParams with explicit integration strategy", () => {
    test("should resolve Integration auth params when strategy is integration", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const resolved = resolveAuthParams(params, "integration");

      expect(resolved).toEqual({
        consumerKey: "test-consumer-key",
        consumerSecret: "test-consumer-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
      });
    });

    test("should throw when strategy is integration but params are invalid", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        // Missing other required fields
      };

      expect(() => {
        resolveAuthParams(params, "integration");
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });
  });
});
