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
  type IntegrationAuthParams,
} from "~/lib/integration-auth";

/** Regex to match the OAuth 1.0a header format. */
const OAUTH1_REGEX =
  /^OAuth oauth_consumer_key="[^"]+", oauth_nonce="[^"]+", oauth_signature="[^"]+", oauth_signature_method="HMAC-SHA256", oauth_timestamp="[^"]+", oauth_token="[^"]+", oauth_version="1\.0"$/;

describe("getIntegrationAuthProvider", () => {
  const params: IntegrationAuthParams = {
    COMMERCE_CONSUMER_KEY: "test-consumer-key",
    COMMERCE_CONSUMER_SECRET: "test-consumer-secret",
    COMMERCE_ACCESS_TOKEN: "test-access-token",
    COMMERCE_ACCESS_TOKEN_SECRET: "test-access-token-secret",
  };

  test("should export getIntegrationAccessToken", () => {
    const integrationProvider = getIntegrationAuthProvider(params);
    expect(integrationProvider).toBeDefined();

    const headers = integrationProvider?.getHeaders(
      "GET",
      "http://localhost/test",
    );
    expect(headers).toHaveProperty(
      "Authorization",
      expect.stringMatching(OAUTH1_REGEX),
    );
  });

  for (const param of [
    "COMMERCE_CONSUMER_KEY",
    "COMMERCE_CONSUMER_SECRET",
    "COMMERCE_ACCESS_TOKEN",
    "COMMERCE_ACCESS_TOKEN_SECRET",
  ]) {
    test(`should return undefined when ${param} is missing`, () => {
      const incompleteParams = {
        ...params,
        [param]: undefined,
      };

      const integrationProvider = getIntegrationAuthProvider(incompleteParams);
      expect(integrationProvider).toBeUndefined();
    });
  }
});
