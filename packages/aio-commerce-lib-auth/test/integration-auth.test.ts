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

import { unwrap, unwrapErr } from "@adobe/aio-commerce-lib-core/result";
import type { InferInput } from "valibot";

import { describe, expect, test } from "vitest";
import {
  getIntegrationAuthProvider,
  tryGetIntegrationAuthProvider,
} from "~/lib/integration-auth/provider";

import type {
  IntegrationAuthParams,
  IntegrationAuthParamsSchema,
} from "~/lib/integration-auth/schema";

/** Regex to match the OAuth 1.0a header format. */
const OAUTH1_REGEX =
  /^OAuth oauth_consumer_key="[^"]+", oauth_nonce="[^"]+", oauth_signature="[^"]+", oauth_signature_method="HMAC-SHA256", oauth_timestamp="[^"]+", oauth_token="[^"]+", oauth_version="1\.0"$/;

describe("Commerce Integration Auth", () => {
  describe("getIntegrationAuthProvider", () => {
    test("should export getIntegrationAuthProvider", () => {
      const integrationAuthProvider = getIntegrationAuthProvider({
        consumerKey: "test-consumer-key",
        consumerSecret: "test-consumer-secret",
        accessToken: "test-access-token",
        accessTokenSecret: "test-access-token-secret",
      });

      const headers = unwrap(
        integrationAuthProvider.getHeaders("GET", "http://localhost/test"),
      );

      expect(headers).toHaveProperty(
        "Authorization",
        expect.stringMatching(OAUTH1_REGEX),
      );
    });
  });

  describe("tryGetIntegrationAuthProvider", () => {
    const params: IntegrationAuthParams = {
      AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: "test-consumer-key",
      AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: "test-consumer-secret",
      AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: "test-access-token",
      AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: "test-access-token-secret",
    };

    test("should export getIntegrationAccessToken", () => {
      const result = unwrap(tryGetIntegrationAuthProvider(params));
      const headers = unwrap(result.getHeaders("GET", "http://localhost/test"));

      expect(headers).toHaveProperty(
        "Authorization",
        expect.stringMatching(OAUTH1_REGEX),
      );
    });

    test("should err with invalid params", () => {
      const result = unwrapErr(
        tryGetIntegrationAuthProvider({} as unknown as IntegrationAuthParams),
      );

      expect(result).toHaveProperty("_tag", "IntegrationAuthValidationError");
      expect(result).toHaveProperty("issues", expect.any(Array));
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
      } satisfies InferInput<typeof IntegrationAuthParamsSchema>);

      expect(() => unwrap(result)).toThrow();

      const error = unwrapErr(result);
      expect(error._tag).toEqual("IntegrationAuthValidationError");
      expect(error.message).toEqual(
        "Failed to validate the provided integration parameters",
      );

      expect(error.issues).toHaveLength(1);
      expect(error.issues[0].message).toEqual(
        `Expected a string value for the Commerce Integration parameter ${param}`,
      );
    });

    test.each([
      ["localhost"],
      ["http:://"],
      ["https://"],
      ["//example.com"],
      ["http://user@:80"],
    ])("should throw an Error on invalid [%s] URL", (url) => {
      const integrationAuthProvider = unwrap(
        tryGetIntegrationAuthProvider(params),
      );

      const getHeadersResult = integrationAuthProvider.getHeaders("GET", url);
      const error = unwrapErr(getHeadersResult);

      expect(error._tag).toEqual("IntegrationAuthValidationError");
      expect(error.message).toEqual(
        "Failed to validate the provided Adobe Commerce URL",
      );
    });
  });
});
