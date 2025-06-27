/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
  getIntegrationAuthProvider,
  type IntegrationAuthParams,
} from "../source/integration-auth";

describe("getIntegrationAuthProvider", () => {
  const params: IntegrationAuthParams = {
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: "test-consumer-key",
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: "test-consumer-secret",
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: "test-access-token",
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: "test-access-token-secret",
  };

  test("should export getIntegrationAccessToken", () => {
    const integrationProvider = getIntegrationAuthProvider(params);
    expect(integrationProvider).toBeDefined();

    const headers = integrationProvider!.getHeaders(
      "GET",
      "http://localhost/test",
    );
    expect(headers).toHaveProperty(
      "Authorization",
      expect.stringMatching(
        /^OAuth oauth_consumer_key="test-consumer-key", oauth_nonce="[^"]+", oauth_signature="[^"]+", oauth_signature_method="HMAC-SHA256", oauth_timestamp="[^"]+", oauth_token="test-access-token", oauth_version="1\.0"$/,
      ),
    );
  });

  [
    "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY",
    "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET",
    "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN",
    "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET",
  ].forEach((param) => {
    test(`should return undefined when ${param} is missing`, () => {
      const incompleteParams = {
        ...params,
        [param]: undefined,
      };

      const integrationProvider = getIntegrationAuthProvider(incompleteParams);

      expect(integrationProvider).toBeUndefined();
    });
  });
});
