import { HttpClientBase } from "#lib/http-client-base";

import type { KyInstance } from "ky";

export type TestHttpClientConfig = {
  apiKey: string;
  baseUrl: string;
};

export class TestHttpClient extends HttpClientBase<TestHttpClientConfig> {
  // biome-ignore lint/complexity/noUselessConstructor: False positive, as we need to override the inherited `protected` access specifier.
  public constructor(config: TestHttpClientConfig, kyInstance: KyInstance) {
    super(config, kyInstance);
  }
}

// Default config for the test HTTP client.
export const TEST_HTTP_CLIENT_CONFIG: TestHttpClientConfig = {
  apiKey: "test-api-key",
  baseUrl: "https://api.example.com",
};
