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

import {
  AdobeCommerceHttpClient,
  AdobeIoEventsHttpClient,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

import type {
  CommerceHttpClientParams,
  IoEventsHttpClientParams,
  PaaSClientParams,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

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

export class TestAdobeIoEventsHttpClient extends AdobeIoEventsHttpClient {
  public constructor(
    params: IoEventsHttpClientParams,
    mockFetch: typeof fetch,
  ) {
    super(params);
    const client = this.httpClient.extend({
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    this.setHttpClient(client);
  }
}

// Default config for the test Adobe Commerce HTTP client for PaaS.
// We are going to run tests using a mock PaaS client (either PaaS or SaaS would work).
export const TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS: PaaSClientParams = {
  config: {
    baseUrl: "https://api.commerce.adobe.com",
    flavor: "paas",
  },

  auth: {
    accessToken: "test-access-token",
    accessTokenSecret: "test-access-token-secret",
    consumerKey: "test-consumer-key",
    consumerSecret: "test-consumer-secret",
  },
};

// Default config for the test Adobe I/O Events HTTP client.
export const TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS: IoEventsHttpClientParams =
  {
    config: {
      baseUrl: "https://api.adobe.io/events",
    },

    auth: {
      clientId: "test-client-id",
      clientSecrets: ["test-client-secret"],
      technicalAccountId: "test-technical-account-id",
      technicalAccountEmail: "test-technical-account-email",
      imsOrgId: "test-ims-org-id",
      environment: "prod",
    },
  };
