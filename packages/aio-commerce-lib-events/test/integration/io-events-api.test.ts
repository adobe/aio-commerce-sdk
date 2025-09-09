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

import { createAdobeIoEventsApiClient } from "#io-events/index";
import { TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS } from "#test/fixtures/http-client-params";
import { ADOBE_IO_EVENTS_API_PAYLOADS } from "#test/fixtures/io-events-api-payloads";

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";

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

// See: https://vitest.dev/guide/mocking.html#requests
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("Adobe IO Events API - Integration Tests", () => {
  // Create a real client
  const baseUrl = "https://api.adobe.io/events";
  const client = createAdobeIoEventsApiClient(
    TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS,
  );

  function makeUrl(pathname: string) {
    return `${baseUrl}/${pathname}`;
  }

  // All tests are the same with different payloads, so we just parameterize them.
  describe.each(ADOBE_IO_EVENTS_API_PAYLOADS)("$name", (payload) => {
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
        http.all(makeUrl(payload.pathname), () => {
          return HttpResponse.json({
            fake_response: "hello",
          });
        }),
      );

      const promise = payload.invoke(client);
      await expect(promise).resolves.not.toThrow();
    });

    test.runIf(payload.hasCamelCaseTransformer)(
      "should run camel case transformer",
      async () => {
        server.use(
          http.all(makeUrl(payload.pathname), () => {
            return HttpResponse.json({ fake_response: "hello" });
          }),
        );

        const result = await payload.invoke(client);
        expect(result).toEqual({
          fakeResponse: "hello",
        });
      },
    );

    test("should handle error responses", async () => {
      server.use(
        http.all(makeUrl(payload.pathname), () => {
          return HttpResponse.json({}, { status: 401 });
        }),
      );

      await expect(payload.invoke(client)).rejects.toThrow();
    });

    test("requests should have ims authorization headers", async () => {
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
          http.all(makeUrl(payload.pathname), () => {
            return HttpResponse.json({});
          }),
        );

        // @ts-expect-error - Testing invalid params
        const invoke = () => client[payload.name]("invalid-params");
        await expect(invoke()).rejects.toThrow();
      },
    );
  });
});
