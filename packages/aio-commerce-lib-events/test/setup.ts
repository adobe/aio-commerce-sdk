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

import { afterEach, beforeEach, vi } from "vitest";

import {
  TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS,
  TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
  TestAdobeCommerceHttpClient,
  TestAdobeIoEventsHttpClient,
} from "#test/fixtures/http-clients";

import type {
  CommerceHttpClientParams,
  IoEventsHttpClientParams,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

/** Generic test setup function for HTTP clients */
function setupTestContext<
  TClient extends TestAdobeCommerceHttpClient | TestAdobeIoEventsHttpClient,
  TParams extends CommerceHttpClientParams | IoEventsHttpClientParams,
>(
  ClientClass: new (params: TParams, fetch: typeof globalThis.fetch) => TClient,
  defaultParams: TParams,
) {
  let testClient: TClient;
  const fetch = vi.fn<typeof globalThis.fetch>((_input, _init) =>
    Promise.resolve(Response.json({}, { status: 200 })),
  );

  beforeEach(() => {
    testClient = new ClientClass(defaultParams, fetch);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  return {
    get testClient() {
      return testClient;
    },

    get fetchMock() {
      return fetch;
    },
  };
}

/** Performs the test setup for the Commerce Events API. */
export function setupCommerceEventsTestContext() {
  return setupTestContext(
    TestAdobeCommerceHttpClient,
    TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS,
  );
}

/** Performs the test setup for the Adobe I/O Events API. */
export function setupIoEventsTestContext() {
  return setupTestContext(
    TestAdobeIoEventsHttpClient,
    TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
  );
}
