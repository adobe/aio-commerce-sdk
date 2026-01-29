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

import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { createCommerceEventsApiClient } from "#commerce/index";
import { COMMERCE_EVENTS_API_PAYLOADS } from "#test/fixtures/commerce-events-api-payloads";
import { TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS } from "#test/fixtures/http-client-params";

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";

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

// See: https://vitest.dev/guide/mocking.html#requests
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("SaaS Commerce Events API - Integration Tests", () => {
  // Create a real client
  const baseUrl = "https://api.commerce.adobe.com/V1";
  const client = createCommerceEventsApiClient(
    TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_SAAS,
  );

  function makeUrl(pathname: string) {
    return `${baseUrl}/${pathname}`;
  }

  // All tests are the same with different payloads, so we just parameterize them.
  describe.each(COMMERCE_EVENTS_API_PAYLOADS)("$name", (payload) => {
    test("should make a request using the correct HTTP method", async () => {
      const capture = {
        method: null as string | null,
      };

      server.use(
        http.all(makeUrl(payload.pathname), ({ request }) => {
          capture.method = request.method;
          return HttpResponse.json({});
        }),
      );

      await payload.invoke(client);
      expect(capture.method).toBe(payload.method);
    });

    test("should handle successful response", async () => {
      server.use(
        http.all(makeUrl(payload.pathname), () =>
          HttpResponse.json({
            fake_response: "hello",
          }),
        ),
      );

      const promise = payload.invoke(client);
      await expect(promise).resolves.not.toThrow();
    });

    test("should handle error responses", async () => {
      server.use(
        http.all(makeUrl(payload.pathname), () =>
          HttpResponse.json({}, { status: 401 }),
        ),
      );

      await expect(payload.invoke(client)).rejects.toThrow();
    });

    test("requests should have oauth authorization header", async () => {
      const capture = { headers: null as Headers | null };
      server.use(
        http.all(makeUrl(payload.pathname), ({ request }) => {
          capture.headers = request.headers;
          return HttpResponse.json({});
        }),
      );

      await payload.invoke(client);

      if (!capture.headers) {
        expect.fail("Captured headers are null");
        return;
      }

      expect(capture.headers.get("Authorization")).toBe(
        "Bearer supersecrettoken",
      );

      expect(capture.headers.get("x-api-key")).toBe("test-client-id");
      expect(capture.headers.get("Store")).toBe("all");
    });

    test("should use custom fetch options", async () => {
      const capture = { headers: null as Headers | null };
      server.use(
        http.all(makeUrl(payload.pathname), ({ request }) => {
          capture.headers = request.headers;
          return HttpResponse.json({});
        }),
      );

      await payload.invoke(client, {
        headers: { "X-Custom-Header": "test-value" },
      });

      if (!capture.headers) {
        expect.fail("Captured headers are null");
        return;
      }

      expect(capture.headers.get("X-Custom-Header")).toBe("test-value");
    });

    test.runIf(payload.hasInputValidation)(
      "should throw an error on schema validation failure",
      async () => {
        server.use(
          http.all(makeUrl(payload.pathname), () => HttpResponse.json({})),
        );

        // @ts-expect-error - Testing invalid params
        const invoke = () => client[payload.name]("invalid-params");
        await expect(invoke()).rejects.toThrow();
      },
    );
  });
});
