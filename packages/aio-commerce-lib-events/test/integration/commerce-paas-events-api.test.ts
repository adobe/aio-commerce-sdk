import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import { createCommerceEventsApiClient } from "#commerce/index";
import { COMMERCE_EVENTS_API_PAYLOADS } from "#test/fixtures/commerce-events-api-payloads";
import { TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS } from "#test/fixtures/http-clients";

const REGEX_OAUTH_TOKEN = /^OAuth/;

// See: https://vitest.dev/guide/mocking.html#requests
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("PaaS Commerce Events API - Integration Tests", () => {
  // Create a real client
  const baseUrl = "https://api.commerce.adobe.com/rest/all/V1";
  const client = createCommerceEventsApiClient(
    TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS,
  );

  function makeUrl(pathname: string) {
    return `${baseUrl}/${pathname}`;
  }

  // All tests are the same with different payloads, so we just parameterize them.
  describe.each(COMMERCE_EVENTS_API_PAYLOADS)("$name", (payload) => {
    test("should make a $method request to $pathname", async () => {
      const capture = {
        method: null as string | null,
      };

      server.use(
        http.all(makeUrl(payload.pathname()), ({ request }) => {
          capture.method = request.method;
          return HttpResponse.json(payload.mockResponse);
        }),
      );

      await payload.invoke(client);
      expect(capture.method).toBe(payload.method);
    });

    test("should handle successful response", async () => {
      server.use(
        http.all(makeUrl(payload.pathname()), () => {
          return HttpResponse.json(payload.mockResponse);
        }),
      );

      const result = await payload.invoke(client);

      // If the `actualResponse` is null, we don't return anything (void).
      if (payload.actualResponse !== null) {
        expect(result).toEqual(payload.actualResponse);
      }
    });

    test("should handle error responses", async () => {
      server.use(
        http.all(makeUrl(payload.pathname()), () => {
          return HttpResponse.json(payload.mockResponse, { status: 401 });
        }),
      );

      await expect(payload.invoke(client)).rejects.toThrow();
    });

    test("requests should have oauth authorization header", async () => {
      const capture = { headers: null as Headers | null };
      server.use(
        http.all(makeUrl(payload.pathname()), ({ request }) => {
          capture.headers = request.headers;
          return HttpResponse.json(payload.mockResponse);
        }),
      );

      await payload.invoke(client);

      if (!capture.headers) {
        expect.fail("Captured headers are null");
        return;
      }

      expect(capture.headers.get("Authorization")).toMatch(REGEX_OAUTH_TOKEN);
    });

    test("should use custom fetch options", async () => {
      const capture = { headers: null as Headers | null };
      server.use(
        http.all(makeUrl(payload.pathname()), ({ request }) => {
          capture.headers = request.headers;
          return HttpResponse.json(payload.mockResponse);
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

    if (payload.invalidInvoke) {
      test("should throw an error on schema validation failure", async () => {
        server.use(
          http.all(makeUrl(payload.pathname()), () => {
            return HttpResponse.json(payload.mockResponse);
          }),
        );

        await expect(payload.invalidInvoke(client)).rejects.toThrow();
      });
    }
  });
});
