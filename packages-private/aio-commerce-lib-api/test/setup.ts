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

import type { HttpClientBase } from "#lib/http-client-base";

type HttpClientParams = { config?: unknown };
type ExtractConfig<TParams> = TParams extends { config: infer C } ? C : never;

type HttpClientFactory<TParams extends HttpClientParams, TClient> = new (
  clientParams: TParams,
  mockFetch: typeof fetch
) => TClient;

/** The default mock response that {@link fetch} will return. */
const DEFAULT_MOCK_RESPONSE = Response.json(
  { hello: "world" },
  {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }
);

/** Performs the test setup for the library API. */
export function setupTestContext<
  TParams extends HttpClientParams,
  TClient extends HttpClientBase<unknown>,
>(ClientFactory: HttpClientFactory<TParams, TClient>, params: TParams) {
  // A mock of the fetch function we're going to use to test the HTTP clients.
  const fetch = vi.fn(
    async (_input, _init) => await Promise.resolve(DEFAULT_MOCK_RESPONSE)
  );

  let testClient: TClient;
  beforeEach(() => {
    testClient = new ClientFactory(params, fetch);
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

    get clientConfig() {
      return testClient.config as ExtractConfig<TParams>;
    },
  };
}
