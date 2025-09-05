import ky, { type KyInstance } from "ky";
import { afterEach, beforeEach, vi } from "vitest";

import type { HttpClientBase } from "#lib/http-client-base";

type HttpClientParams = { config: { baseUrl: string } };
type ExtractConfig<TParams> = TParams extends { config: infer C } ? C : never;

type HttpClientFactory<TParams extends HttpClientParams, TClient> = new (
  clientParams: TParams,
  kyInstance: KyInstance,
) => TClient;

/** The default mock response that {@link fetch} will return. */
const DEFAULT_MOCK_RESPONSE = Response.json(
  { hello: "world" },
  {
    status: 200,
    headers: { "Content-Type": "application/json" },
  },
);

/** Performs the test setup for the library API. */
export function libApiTestSetup<
  TParams extends HttpClientParams,
  TClient extends HttpClientBase<unknown>,
>(ClientFactory: HttpClientFactory<TParams, TClient>, params: TParams) {
  // A mock of the fetch function we're going to use to test the HTTP clients.
  const fetch = vi.fn(
    async (_input, _init) => await Promise.resolve(DEFAULT_MOCK_RESPONSE),
  );

  let testClient: TClient;
  beforeEach(() => {
    const kyClient = ky.create({
      prefixUrl: params.config.baseUrl,
      fetch: fetch as unknown as typeof globalThis.fetch,
    });

    testClient = new ClientFactory(params, kyClient);
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
      return params.config as ExtractConfig<TParams>;
    },
  };
}
