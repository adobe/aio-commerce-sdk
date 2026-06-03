/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";

export const BASE_URL = "https://commerce.test";

export const TEST_CLIENT_PARAMS: CommerceHttpClientParams = {
  config: { baseUrl: BASE_URL, flavor: "paas" as const },
  auth: {
    accessToken: "test-access-token",
    accessTokenSecret: "test-access-token-secret",
    consumerKey: "test-consumer-key",
    consumerSecret: "test-consumer-secret",
  },
  fetchOptions: { retry: 0 },
};

export class TestAdobeCommerceHttpClient extends AdobeCommerceHttpClient {
  public constructor(
    params: CommerceHttpClientParams,
    mockFetch: typeof fetch,
  ) {
    super(params);
    const client = this.httpClient.extend({
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });
    this.setHttpClient(client);
  }
}

export function makeHttpClient(mockFetch: typeof fetch) {
  return new TestAdobeCommerceHttpClient(TEST_CLIENT_PARAMS, mockFetch);
}
