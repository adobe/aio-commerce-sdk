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

import ky from "ky";
import { describe, expect, it } from "vitest";

import { HttpClientBase } from "#lib/http-client-base";
import { libApiTestSetup } from "#test/setup";

import type { Options } from "ky";

describe("lib/http-client-base", () => {
  const context = libApiTestSetup();

  describe("constructor and properties", () => {
    it("should freeze the config and make it immutable", () => {
      const { testClient } = context;
      expect(Object.isFrozen(testClient.config)).toBe(true);
      expect(() => {
        // @ts-expect-error - Testing immutability
        testClient.config.apiKey = "new-key";
      }).toThrow();
    });

    it("should store the config correctly", () => {
      const { testClient, clientConfig } = context;
      expect(testClient.config.apiKey).toBe(clientConfig.apiKey);
      expect(testClient.config.baseUrl).toBe(clientConfig.baseUrl);
    });

    it("should bind HTTP methods correctly", () => {
      const { testClient } = context;
      expect(testClient.get).toBeDefined();
      expect(testClient.post).toBeDefined();
      expect(testClient.put).toBeDefined();
      expect(testClient.delete).toBeDefined();
      expect(testClient.patch).toBeDefined();
      expect(testClient.head).toBeDefined();
      expect(testClient.stop).toBeDefined();
    });

    it("should have the stop property", () => {
      const { testClient } = context;
      expect(testClient.stop).toBe(ky.stop);
    });

    it("should not have the create method", () => {
      const { testClient } = context;
      // @ts-expect-error - Testing missing method
      expect(testClient.create).toBeUndefined();
    });
  });

  describe("extend method", () => {
    const extendOptions: Options = {
      headers: { "X-Extended": "true" },
    };

    it("should create a new instance with extended options", async () => {
      const { testClient } = context;
      const extendedClient = testClient.extend(extendOptions);
      expect(extendedClient).toBeInstanceOf(HttpClientBase);
      expect(extendedClient).not.toBe(testClient);

      // Sample invocation to ensure the extended client is working
      await extendedClient.get("test", {
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
      const { testClient } = context;
      const extendedClient = testClient.extend(extendOptions);

      expect(extendedClient.config).toEqual(testClient.config);
      expect(extendedClient.config).toBe(testClient.config);
    });

    it("should support function-based options", async () => {
      const { testClient } = context;
      const extendFunction = () => extendOptions;

      const extendedClient = testClient.extend(extendFunction);
      expect(extendedClient).toBeInstanceOf(HttpClientBase);

      // Sample invocation to ensure the extended client is working
      await extendedClient.get("test", {
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
