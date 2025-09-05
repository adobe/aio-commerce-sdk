import ky, { type KyInstance } from "ky";
import { afterEach, beforeEach, vi } from "vitest";

import { HttpClientBase } from "#lib/http-client-base";

export type TestHttpClientConfig = {
  apiKey: string;
  baseUrl: string;
};

// Now create your test class that inherits from the mocked base
export class TestHttpClient extends HttpClientBase<TestHttpClientConfig> {
  // biome-ignore lint/complexity/noUselessConstructor: False positive, as we need to override the inherited `protected` access specifier.
  public constructor(config: TestHttpClientConfig, kyInstance: KyInstance) {
    super(config, kyInstance);
  }
}

/** Performs the test setup for the library API. */
export function libApiTestSetup() {
  // A mock of the fetch function we're going to use to test the HTTP client.
  const fetch = vi.fn(async (_input, _init) => {
    return await Promise.resolve(
      new Response(JSON.stringify({ hello: "world" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  let testClient: TestHttpClient;
  const clientConfig: TestHttpClientConfig = {
    apiKey: "test-api-key",
    baseUrl: "https://api.example.com",
  };

  beforeEach(() => {
    const kyClient = ky.create({
      prefixUrl: clientConfig.baseUrl,
      fetch: fetch as unknown as typeof globalThis.fetch,
    });

    testClient = new TestHttpClient(clientConfig, kyClient);
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
