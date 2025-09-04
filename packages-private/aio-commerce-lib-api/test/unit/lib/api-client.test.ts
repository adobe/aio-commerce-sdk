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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "#lib/api-client";
import { HttpClientBase } from "#lib/http-client-base";
import { buildMockKyClient } from "#test/fixtures/ky-client";

import type { KyInstance } from "ky";

type Config = { apiKey: string; baseUrl: string };

// Test class that extends HttpClientBase to access protected constructor
class TestHttpClient extends HttpClientBase<Config> {
  // biome-ignore lint/complexity/noUselessConstructor: False positive, as we need to override the inherited `protected` access specifier.
  public constructor(config: Config, httpClient: KyInstance) {
    super(config, httpClient);
  }
}

describe("lib/api-client", () => {
  let mockKyInstance: KyInstance;
  let mockConfig: Config;
  let testClient: TestHttpClient;

  beforeEach(() => {
    mockKyInstance = buildMockKyClient();
    mockConfig = {
      apiKey: "test-api-key",
      baseUrl: "https://api.example.com",
    };

    testClient = new TestHttpClient(mockConfig, mockKyInstance);
  });

  describe("create", () => {
    const sum = vi.fn((_client: TestHttpClient, a: number, b: number) => {
      return a + b;
    });

    const getApiKey = vi.fn((client: TestHttpClient) => {
      // Test that the client has access to the config.
      return client.config.apiKey;
    });

    const asyncOp = vi.fn(async (_client: TestHttpClient, value: string) => {
      await Promise.resolve();
      return `ok:${value}`;
    });

    it("should bind provided functions to the client and preserve shape", async () => {
      const api = ApiClient.create(testClient, { sum, getApiKey, asyncOp });
      expect(api.sum).toBeDefined();
      expect(api.getApiKey).toBeDefined();
      expect(api.asyncOp).toBeDefined();

      const r1 = api.sum(2, 3);
      expect(r1).toBe(5);
      expect(sum).toHaveBeenCalledTimes(1);
      expect(sum).toHaveBeenCalledWith(testClient, 2, 3);

      const r2 = api.getApiKey();
      expect(r2).toBe(mockConfig.apiKey);
      expect(getApiKey).toHaveBeenCalledTimes(1);
      expect(getApiKey).toHaveBeenCalledWith(testClient);

      const r3 = await api.asyncOp("value");
      expect(r3).toBe("ok:value");
      expect(asyncOp).toHaveBeenCalledTimes(1);
      expect(asyncOp).toHaveBeenCalledWith(testClient, "value");
    });
  });
});
