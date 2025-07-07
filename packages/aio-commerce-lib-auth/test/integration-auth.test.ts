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
  type IntegrationAuthParamsInput,
  tryGetIntegrationAuthProvider,
} from "~/lib/integration-auth";
import { getData, getError, isSuccess } from "~/lib/result";

/** Regex to match the OAuth 1.0a header format. */
const OAUTH1_REGEX =
  /^OAuth oauth_consumer_key="[^"]+", oauth_nonce="[^"]+", oauth_signature="[^"]+", oauth_signature_method="HMAC-SHA256", oauth_timestamp="[^"]+", oauth_token="[^"]+", oauth_version="1\.0"$/;

describe("integration auth", () => {
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

  describe("tryGetIntegrationAuthProvider", () => {
    const params: IntegrationAuthParamsInput = {
      AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: "test-consumer-key",
      AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: "test-consumer-secret",
      AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: "test-access-token",
      AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: "test-access-token-secret",
    };

    test("should export getIntegrationAccessToken", () => {
      const result = tryGetIntegrationAuthProvider(params);

      expect(isSuccess(result)).toBeTruthy();
      const headers = result.value.getHeaders("GET", "http://localhost/test");
      expect(headers).toHaveProperty(
        "Authorization",
        expect.stringMatching(OAUTH1_REGEX),
      );
    });

    test.each([
      "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY",
      "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET",
      "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN",
      "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET",
    ])("should throw error when %s is missing", (param) => {
      const result = tryGetIntegrationAuthProvider({
        ...params,
        [param]: undefined,
      } as IntegrationAuthParamsInput);

      expect(() => getData(result)).toThrow("Cannot get data from a Failure");
      expect(getError(result)._tag).toEqual("ValidationError");
      expect(getError(result).message).toEqual(
        "Failed to validate the provided integration parameters. See the console for more details.",
      );
    });

    test.each([
      ["localhost"],
      ["http:://"],
      ["https://"],
      ["//example.com"],
      ["http://user@:80"],
    ])("should throw an Error on invalid [%s] URL", (url) => {
      const result = tryGetIntegrationAuthProvider(params);
      expect(isSuccess(result)).toBeTruthy();
      expect(result.value).toBeDefined();

      expect(() => {
        result.value.getHeaders("GET", url);
      }).toThrow(
        "Failed to validate the provided commerce URL. See the console for more details.",
      );
    });
  });
});
