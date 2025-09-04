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

import { beforeEach, describe, expect, it } from "vitest";

import { HttpClientBase } from "#lib/http-client-base";
import { httpMethodTests } from "#test/fixtures/http-payloads";
import { buildMockKyClient } from "#test/fixtures/ky-client";

import type { KyInstance, Options } from "ky";

// Test class that extends HttpClientBase to access protected constructor
class TestHttpClient<T> extends HttpClientBase<T> {
  // biome-ignore lint/complexity/noUselessConstructor: False positive, as we need to override the inherited `protected` access specifier.
  public constructor(config: T, httpClient: KyInstance) {
    super(config, httpClient);
  }
}

describe("lib/http-client-base", () => {
  let mockKyInstance: KyInstance;
  let mockConfig: { apiKey: string; baseUrl: string };
  let testClient: TestHttpClient<typeof mockConfig>;

  beforeEach(() => {
    mockKyInstance = buildMockKyClient();
    mockConfig = {
      apiKey: "test-api-key",
      baseUrl: "https://api.example.com",
    };

    testClient = new TestHttpClient(mockConfig, mockKyInstance);
  });

  describe("constructor", () => {
    it("should freeze the config and make it immutable", () => {
      expect(Object.isFrozen(testClient.config)).toBe(true);
      expect(() => {
        // @ts-expect-error - Testing immutability
        testClient.config.apiKey = "new-key";
      }).toThrow();
    });

    it("should store the config correctly", () => {
      expect(testClient.config).toEqual(mockConfig);
      expect(testClient.config.apiKey).toBe("test-api-key");
      expect(testClient.config.baseUrl).toBe("https://api.example.com");
    });

    it("should bind HTTP methods correctly", () => {
      expect(testClient.get).toBeDefined();
      expect(testClient.post).toBeDefined();
      expect(testClient.put).toBeDefined();
      expect(testClient.delete).toBeDefined();
      expect(testClient.patch).toBeDefined();
      expect(testClient.head).toBeDefined();
      expect(testClient.stop).toBeDefined();
    });
  });

  describe("HTTP client binding", () => {
    it.each(httpMethodTests)(
      "should call the underlying $method method",
      async ({ method, options }) => {
        const url = "/test";

        if (options !== null) {
          await testClient[method](url, options);
          expect(mockKyInstance[method]).toHaveBeenCalledWith(url, options);
        } else {
          await testClient[method](url);
          expect(mockKyInstance[method]).toHaveBeenCalledWith(url);
        }

        expect(mockKyInstance[method]).toHaveBeenCalledTimes(1);
      },
    );

    it("should have the stop property", () => {
      expect(testClient.stop).toBe(mockKyInstance.stop);
    });

    it("should not have the create method", () => {
      // @ts-expect-error - Testing missing method
      expect(testClient.create).toBeUndefined();
    });
  });

  describe("extend method", () => {
    const extendOptions: Options = {
      headers: { "X-Extended": "true" },
    };

    it("should create a new instance with extended options", async () => {
      const extendedClient = testClient.extend(extendOptions);
      expect(extendedClient).toBeInstanceOf(HttpClientBase);
      expect(extendedClient).not.toBe(testClient);

      // Sample invocation to ensure the extended client is working
      await extendedClient.get("/test", {
        hooks: {
          beforeRequest: [
            (request) => {
              expect(request.headers.get("X-Extended")).toBe("true");
            },
          ],
        },
      });
    });

    it("should preserve the original config in extended instance", () => {
      const extendedClient = testClient.extend(extendOptions);

      expect(extendedClient.config).toEqual(mockConfig);
      expect(extendedClient.config).toBe(testClient.config);
    });

    it("should support function-based options", async () => {
      const extendFunction = () => extendOptions;

      const extendedClient = testClient.extend(extendFunction);
      expect(extendedClient).toBeInstanceOf(HttpClientBase);

      // Sample invocation to ensure the extended client is working
      await extendedClient.get("/test", {
        hooks: {
          beforeRequest: [
            (request) => {
              expect(request.headers.get("X-Extended")).toBe("true");
            },
          ],
        },
      });
    });
  });
});
