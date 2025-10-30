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

import { AdobeCommerceHttpClient } from "#index";
import {
  TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
  TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS,
  TestAdobeCommerceHttpClient,
} from "#test/fixtures/http-clients";
import { setupTestContext } from "#test/setup";

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import type { CommerceHttpClientParams } from "#index";

const DOUBLE_SLASH_REGEX = /(?<!:)\/\//;

vi.mock("@adobe/aio-commerce-lib-auth", async () => {
  const original = await vi.importActual("@adobe/aio-commerce-lib-auth");
  return {
    ...original,
    getImsAuthProvider: vi.fn((params: ImsAuthParams) => ({
      getHeaders: vi.fn(() => ({
        Authorization: "Bearer supersecrettoken",
        "x-api-key": params.clientId,
      })),
    })),
  };
});

describe("lib/commerce/http-client", () => {
  test("should throw an error with unknown flavor", () => {
    expect(() => {
      new AdobeCommerceHttpClient({
        config: { flavor: "unknown" },
      } as unknown as CommerceHttpClientParams);
    }).toThrow("Invalid Commerce configuration. Unknown flavor: unknown");
  });

  describe.each([
    {
      flavor: "paas",
      params: TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
      expectedUrl: "https://api.commerce.adobe.com/rest/all/V1/test",
    },
    {
      flavor: "saas",
      params: TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS,
      expectedUrl: "https://api.commerce.adobe.com/V1/test",
    },
  ])("$flavor HTTP Client", ({ flavor, params, expectedUrl }) => {
    const context = setupTestContext(TestAdobeCommerceHttpClient, params);

    describe("constructor and config", () => {
      test(`should keep ${flavor} flavor in config`, () => {
        const { testClient } = context;
        expect(testClient.config.flavor).toBe(flavor);
      });

      test("should set default config values", () => {
        const { testClient } = context;
        expect(testClient.config.storeViewCode).toBe("all");
        expect(testClient.config.version).toBe("V1");
      });
    });

    describe("request handling", () => {
      test("should use correct base url", async () => {
        const { testClient } = context;
        await testClient.get("test", {
          hooks: {
            beforeRequest: [
              (request) => {
                expect(request.url).toBe(expectedUrl);
              },
            ],
          },
        });
      });

      if (flavor === "saas") {
        test("should include Store header for SaaS", async () => {
          const { testClient } = context;
          await testClient.get("test", {
            hooks: {
              beforeRequest: [
                (request) => {
                  expect(request.headers.get("Store")).toBe("all");
                },
              ],
            },
          });
        });
      }
    });

    describe("authentication", () => {
      if (flavor === "paas") {
        test("should use OAuth 1.0a authentication", async () => {
          const { testClient } = context;
          await testClient.get("test", {
            hooks: {
              beforeRequest: [
                (request) => {
                  const authHeader = request.headers.get("Authorization");
                  expect(authHeader).toContain("OAuth");
                  expect(authHeader).toContain("oauth_consumer_key");
                  expect(authHeader).toContain("oauth_token");
                  expect(authHeader).toContain("oauth_signature");
                },
              ],
            },
          });
        });
      }

      if (flavor === "saas") {
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
      }
    });
  });

  describe("PaaS custom auth provider", () => {
    const customContext = setupTestContext(TestAdobeCommerceHttpClient, {
      ...TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
      auth: {
        getHeaders: vi.fn(() => ({
          Authorization:
            "OAuth oauth_consumer_key=custom-consumer-key, oauth_signature=custom-signature",
        })),
      },
    });

    test("should use custom integration auth provider", async () => {
      const { testClient } = customContext;
      await testClient.get("test", {
        hooks: {
          beforeRequest: [
            (request) => {
              expect(request.headers.get("Authorization")).toBe(
                "OAuth oauth_consumer_key=custom-consumer-key, oauth_signature=custom-signature",
              );
            },
          ],
        },
      });
    });
  });

  describe("SaaS custom auth provider", () => {
    const getAccessToken = vi.fn(() => Promise.resolve("customsecrettoken"));
    const customContext = setupTestContext(TestAdobeCommerceHttpClient, {
      ...TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS,
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
    const context = setupTestContext(TestAdobeCommerceHttpClient, {
      ...TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
      fetchOptions: { headers: { "x-custom-header": "custom-value" } },
    });

    test("should be extendable with custom headers", async () => {
      const { testClient } = context;
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
        flavor: "paas",
        baseUrl: "https://api.commerce.adobe.com/",
        expectedUrl: "https://api.commerce.adobe.com/rest/all/V1/test",
      },
      {
        flavor: "paas",
        baseUrl: "https://api.commerce.adobe.com",
        expectedUrl: "https://api.commerce.adobe.com/rest/all/V1/test",
      },
      {
        flavor: "saas",
        baseUrl: "https://api.commerce.adobe.com/",
        expectedUrl: "https://api.commerce.adobe.com/V1/test",
      },
      {
        flavor: "saas",
        baseUrl: "https://api.commerce.adobe.com",
        expectedUrl: "https://api.commerce.adobe.com/V1/test",
      },
    ])(
      "should handle trailing slashes correctly for $flavor with baseUrl: $baseUrl",
      async ({ flavor, baseUrl, expectedUrl }) => {
        const mockFetch = vi.fn(async () =>
          Response.json({ hello: "world" }, { status: 200 }),
        );

        const baseParams =
          flavor === "paas"
            ? TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS
            : TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS;

        const params = {
          ...baseParams,
          config: {
            ...baseParams.config,
            baseUrl,
          },
        } as CommerceHttpClientParams;

        const testClient = new TestAdobeCommerceHttpClient(params, mockFetch);
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
