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

import { describe, expect, test, vi } from "vitest";

import {
  TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
  TestAdobeIoEventsHttpClient,
} from "#test/fixtures/http-clients";
import { setupTestContext } from "#test/setup";

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import type { IoEventsHttpClientParams } from "#index";

const DOUBLE_SLASH_REGEX = /(?<!:)\/\//;

vi.mock("@adobe/aio-commerce-lib-auth", async () => {
  const original = await vi.importActual("@adobe/aio-commerce-lib-auth");
  return {
    ...original,
    getImsAuthProvider: vi.fn((params: ImsAuthParams) => {
      return {
        getHeaders: vi.fn(() => {
          return {
            Authorization: "Bearer supersecrettoken",
            "x-api-key": params.clientId,
          };
        }),
      };
    }),
  };
});

describe("lib/io-events/http-client", () => {
  const context = setupTestContext(
    TestAdobeIoEventsHttpClient,
    TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
  );

  describe("constructor and config", () => {
    test("should set default base URL when no config provided", () => {
      const mockFetch = vi.fn(async () =>
        Response.json({ hello: "world" }, { status: 200 }),
      );

      const params: IoEventsHttpClientParams = {
        auth: TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS.auth,
        // No config provided to test default
      };

      const testClient = new TestAdobeIoEventsHttpClient(params, mockFetch);
      expect(testClient.config.baseUrl).toBe("https://api.adobe.io/events");
    });

    test("should use custom base URL", () => {
      const { testClient } = context;
      expect(testClient.config.baseUrl).toBe("https://api.adobe.io/events");
    });
  });

  describe("request handling", () => {
    test("should use correct base url", async () => {
      const { testClient } = context;
      await testClient.get("test", {
        hooks: {
          beforeRequest: [
            (request) => {
              expect(request.url).toBe("https://api.adobe.io/events/test");
            },
          ],
        },
      });
    });

    test("should include Accept header", async () => {
      const { testClient } = context;
      await testClient.get("test", {
        hooks: {
          beforeRequest: [
            (request) => {
              expect(request.headers.get("Accept")).toBe(
                "application/hal+json",
              );
            },
          ],
        },
      });
    });
  });

  describe("authentication", () => {
    test("should use Bearer token authentication", async () => {
      const { testClient } = context;
      await testClient.get("test", {
        hooks: {
          beforeRequest: [
            (request) => {
              const authHeader = request.headers.get("Authorization");
              const apiKeyHeader = request.headers.get("x-api-key");
              expect(authHeader).toBe("Bearer supersecrettoken");
              expect(apiKeyHeader).toBe("test-client-id");
            },
          ],
        },
      });
    });
  });

  describe("custom auth provider", () => {
    const getAccessToken = vi.fn(() => Promise.resolve("customsecrettoken"));
    const customContext = setupTestContext(TestAdobeIoEventsHttpClient, {
      ...TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
      auth: {
        getAccessToken,
        getHeaders: vi.fn(async () => ({
          Authorization: `Bearer ${await getAccessToken()}`,
          "x-api-key": "custom-client-id",
        })),
      },
    });

    test("should use custom IMS auth provider", async () => {
      const { testClient } = customContext;
      await testClient.get("test", {
        hooks: {
          beforeRequest: [
            (request) => {
              expect(request.headers.get("x-api-key")).toBe("custom-client-id");
              expect(request.headers.get("Authorization")).toBe(
                "Bearer customsecrettoken",
              );
            },
          ],
        },
      });
    });
  });

  describe("extension with custom fetch options", () => {
    const customContext = setupTestContext(TestAdobeIoEventsHttpClient, {
      ...TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
      fetchOptions: { headers: { "x-custom-header": "custom-value" } },
    });

    test("should be extendable with custom headers", async () => {
      const { testClient } = customContext;
      await testClient.get("test", {
        hooks: {
          beforeRequest: [
            (request) => {
              expect(request.headers.get("x-custom-header")).toBe(
                "custom-value",
              );
            },
          ],
        },
      });
    });
  });

  describe("URL formation with trailing slashes", () => {
    test.each([
      {
        baseUrl: "https://api.adobe.io/events/",
        expectedUrl: "https://api.adobe.io/events/test",
      },
      {
        baseUrl: "https://api.adobe.io/events",
        expectedUrl: "https://api.adobe.io/events/test",
      },
    ])(
      "should handle trailing slashes correctly with baseUrl: $baseUrl",
      async ({ baseUrl, expectedUrl }) => {
        const mockFetch = vi.fn(async () =>
          Response.json({ hello: "world" }, { status: 200 }),
        );

        const params: IoEventsHttpClientParams = {
          ...TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
          config: {
            baseUrl,
          },
        };

        const testClient = new TestAdobeIoEventsHttpClient(params, mockFetch);
        await testClient.get("test", {
          hooks: {
            beforeRequest: [
              (request) => {
                expect(request.url).toBe(expectedUrl);
                // Ensure no double slashes in the path (except after protocol)
                expect(request.url).not.toMatch(DOUBLE_SLASH_REGEX);
              },
            ],
          },
        });
      },
    );
  });
});
