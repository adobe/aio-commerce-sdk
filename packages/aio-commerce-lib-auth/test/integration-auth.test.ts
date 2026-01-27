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

import {
  getIntegrationAuthProvider,
  isIntegrationAuthProvider,
} from "#lib/integration-auth/provider";
import {
  assertIntegrationAuthParams,
  resolveIntegrationAuthParams,
} from "#lib/integration-auth/utils";

/** Regex to match the OAuth 1.0a header format. */
const OAUTH1_REGEX =
  /^OAuth oauth_consumer_key="[^"]+", oauth_nonce="[^"]+", oauth_signature="[^"]+", oauth_signature_method="HMAC-SHA256", oauth_timestamp="[^"]+", oauth_token="[^"]+", oauth_version="1\.0"$/;

describe("aio-commerce-lib-auth/integration-auth", () => {
  describe("getIntegrationAuthProvider", () => {
    test("should export getIntegrationAuthProvider", () => {
      const integrationAuthProvider = getIntegrationAuthProvider({
        consumerKey: "test-consumer-key",
        consumerSecret: "test-consumer-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
      });

      const headers = integrationAuthProvider.getHeaders(
        "GET",
        "http://localhost/test",
      );

      const headersWithUrlObject = integrationAuthProvider.getHeaders(
        "GET",
        new URL("http://localhost/test"),
      );

      expect(headers).toHaveProperty(
        "Authorization",
        expect.stringMatching(OAUTH1_REGEX),
      );

      expect(headersWithUrlObject).toHaveProperty(
        "Authorization",
        expect.stringMatching(OAUTH1_REGEX),
      );
    });
  });

  describe("assertIntegrationAuthParams", () => {
    test("should not throw with valid params", () => {
      expect(() => {
        assertIntegrationAuthParams({
          consumerKey: "test-consumer-key",
          consumerSecret: "test-consumer-secret",
          accessToken: "test-access-token",
          accessTokenSecret: "test-access-token-secret",
        });
      }).not.toThrow();
    });

    test("should throw CommerceSdkValidationError when invalid", () => {
      expect(() => {
        assertIntegrationAuthParams({});
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });
  });

  describe("assertIntegrationAuthParams edge cases", () => {
    const validConfig = {
      consumerKey: "test-consumer-key",
      consumerSecret: "test-consumer-secret",
      accessToken: "test-access-token",
      accessTokenSecret: "test-access-token-secret",
    };

    test("should throw with missing consumerKey", () => {
      const { consumerKey: _, ...configWithoutConsumerKey } = validConfig;
      expect(() => {
        assertIntegrationAuthParams(configWithoutConsumerKey);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with empty consumerKey", () => {
      expect(() => {
        assertIntegrationAuthParams({
          ...validConfig,
          consumerKey: "",
        });
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with missing consumerSecret", () => {
      const { consumerSecret: _, ...configWithoutConsumerSecret } = validConfig;
      expect(() => {
        assertIntegrationAuthParams(configWithoutConsumerSecret);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with empty consumerSecret", () => {
      expect(() => {
        assertIntegrationAuthParams({
          ...validConfig,
          consumerSecret: "",
        });
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with missing accessToken", () => {
      const { accessToken: _, ...configWithoutAccessToken } = validConfig;
      expect(() => {
        assertIntegrationAuthParams(configWithoutAccessToken);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with empty accessToken", () => {
      expect(() => {
        assertIntegrationAuthParams({
          ...validConfig,
          accessToken: "",
        });
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with missing accessTokenSecret", () => {
      const { accessTokenSecret: _, ...configWithoutAccessTokenSecret } =
        validConfig;
      expect(() => {
        assertIntegrationAuthParams(configWithoutAccessTokenSecret);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with empty accessTokenSecret", () => {
      expect(() => {
        assertIntegrationAuthParams({
          ...validConfig,
          accessTokenSecret: "",
        });
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with wrong data types", () => {
      expect(() => {
        assertIntegrationAuthParams({
          consumerKey: 123,
          consumerSecret: true,
          accessToken: null,
          accessTokenSecret: undefined,
        } as unknown as typeof validConfig);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw with null values", () => {
      expect(() => {
        assertIntegrationAuthParams({
          ...validConfig,
          consumerKey: null,
        } as unknown as typeof validConfig);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test.each([
      ["consumerKey", { consumerKey: undefined }],
      ["consumerSecret", { consumerSecret: undefined }],
      ["accessToken", { accessToken: undefined }],
      ["accessTokenSecret", { accessTokenSecret: undefined }],
    ])("should throw when %s is missing", (_field, overrides) => {
      expect(() => {
        assertIntegrationAuthParams({
          ...validConfig,
          ...overrides,
        });
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should handle extra unknown properties", () => {
      expect(() => {
        assertIntegrationAuthParams({
          ...validConfig,
          extraProperty: "should-be-ignored",
          anotherExtra: 123,
        });
      }).not.toThrow();
    });
  });

  describe("resolveIntegrationAuthParams", () => {
    test("should resolve Integration auth params from App Builder action inputs", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      const resolved = resolveIntegrationAuthParams(params);

      expect(resolved).toEqual({
        consumerKey: "test-consumer-key",
        consumerSecret: "test-consumer-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
      });
    });

    test("should throw CommerceSdkValidationError when required params are missing", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        // Missing other required fields
      };

      expect(() => {
        resolveIntegrationAuthParams(params);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw CommerceSdkValidationError with empty consumerKey", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      expect(() => {
        resolveIntegrationAuthParams(params);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw CommerceSdkValidationError with empty consumerSecret", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      expect(() => {
        resolveIntegrationAuthParams(params);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw CommerceSdkValidationError with empty accessToken", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      expect(() => {
        resolveIntegrationAuthParams(params);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw CommerceSdkValidationError with empty accessTokenSecret", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "test-consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET: "",
      };

      expect(() => {
        resolveIntegrationAuthParams(params);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw CommerceSdkValidationError with invalid data types", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: 123,
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: true,
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: null,
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET: undefined,
      };

      expect(() => {
        resolveIntegrationAuthParams(params);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });

    test("should throw CommerceSdkValidationError with null values", () => {
      const params = {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: null,
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "test-consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "test-access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "test-access-token-secret",
      };

      expect(() => {
        resolveIntegrationAuthParams(params);
      }).toThrow("Invalid IntegrationAuthProvider configuration");
    });
  });

  describe("isIntegrationAuthProvider", () => {
    test("should return true for Integration auth provider", () => {
      const provider = getIntegrationAuthProvider({
        consumerKey: "test-consumer-key",
        consumerSecret: "test-consumer-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
      });

      expect(isIntegrationAuthProvider(provider)).toBe(true);
    });

    test("should return false for plain Integration auth params", () => {
      const params = {
        consumerKey: "test-consumer-key",
        consumerSecret: "test-consumer-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
      };

      expect(isIntegrationAuthProvider(params)).toBe(false);
    });

    test("should return false for null", () => {
      expect(isIntegrationAuthProvider(null)).toBe(false);
    });

    test("should return false for undefined", () => {
      expect(isIntegrationAuthProvider(undefined)).toBe(false);
    });

    test("should return false for non-object types", () => {
      expect(isIntegrationAuthProvider("string")).toBe(false);
      expect(isIntegrationAuthProvider(true)).toBe(false);
    });

    test("should return false for objects without required properties", () => {
      expect(isIntegrationAuthProvider({})).toBe(false);
    });

    test("should return false for objects with getHeaders that is not a function", () => {
      expect(isIntegrationAuthProvider({ getHeaders: "anything" })).toBe(false);
      expect(isIntegrationAuthProvider({ getHeaders: 123 })).toBe(false);
    });

    test("should return true for objects with getHeaders function", () => {
      expect(
        isIntegrationAuthProvider({
          getHeaders: () => ({ Authorization: "" }),
        }),
      ).toBe(true);
    });
  });
});
