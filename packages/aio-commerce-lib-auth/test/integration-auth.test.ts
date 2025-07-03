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
  getIntegrationAuthProviderWithParams,
  type IntegrationAuthParamsInput,
} from "~/lib/integration-auth";

/** Regex to match the OAuth 1.0a header format. */
const OAUTH1_REGEX =
  /^OAuth oauth_consumer_key="[^"]+", oauth_nonce="[^"]+", oauth_signature="[^"]+", oauth_signature_method="HMAC-SHA256", oauth_timestamp="[^"]+", oauth_token="[^"]+", oauth_version="1\.0"$/;

describe("getIntegrationAuthProviderWithParams", () => {
  const params: IntegrationAuthParamsInput = {
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: "test-consumer-key",
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: "test-consumer-secret",
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: "test-access-token",
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: "test-access-token-secret",
  };

  test("should export getIntegrationAccessToken", () => {
    const result = getIntegrationAuthProviderWithParams(params);

    expect(result.isSuccess()).toBeTruthy();
    const headers = result.data.getHeaders("GET", "http://localhost/test");
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
    const result = getIntegrationAuthProviderWithParams({
      ...params,
      [param]: undefined,
    } as IntegrationAuthParamsInput);

    expect(() => result.data).toThrow("Cannot get data from a Failure");
    expect(result.error._tag).toEqual("ValidationError");
    expect(result.error.message).toEqual(
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
    const result = getIntegrationAuthProviderWithParams(params);
    expect(result.isSuccess()).toBeTruthy();
    expect(result.data).toBeDefined();

    expect(() => {
      result.data.getHeaders("GET", url);
    }).toThrow(
      "Failed to validate the provided commerce URL. See the console for more details.",
    );
  });
});
