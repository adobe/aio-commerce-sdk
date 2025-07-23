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
  assertIntegrationAuthParams,
  getIntegrationAuthProvider,
} from "~/lib/integration-auth/provider";

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

      expect(headers).toHaveProperty(
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
  });
});
