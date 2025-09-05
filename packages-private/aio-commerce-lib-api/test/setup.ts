import ky, { type KyInstance } from "ky";
import { afterEach, beforeEach, vi } from "vitest";

import type { HttpClientBase } from "#lib/http-client-base";

type TestConfigBase = {
  baseUrl: string;
  [key: string]: unknown;
};

// A constructor of a class that extends HttpClientBase.
type TestClientFactory<
  TConfig extends TestConfigBase,
  TClient extends HttpClientBase<TConfig>,
> = new (config: TConfig, kyInstance: KyInstance) => TClient;

/** Performs the test setup for the library API. */
export function libApiTestSetup<
  TConfig extends TestConfigBase,
  TClient extends HttpClientBase<TConfig>,
  TClientFactory extends TestClientFactory<TConfig, TClient>,
>(ClientFactory: TClientFactory, clientConfig: TConfig) {
  // A mock of the fetch function we're going to use to test the HTTP client.
  const fetch = vi.fn(async (_input, _init) => {
    return await Promise.resolve(
      new Response(JSON.stringify({ hello: "world" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  let testClient: TClient;
  beforeEach(() => {
    const kyClient = ky.create({
      prefixUrl: clientConfig.baseUrl,
      fetch: fetch as unknown as typeof globalThis.fetch,
    });

    testClient = new ClientFactory(clientConfig, kyClient);
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
      return clientConfig;
    },
  };
}
