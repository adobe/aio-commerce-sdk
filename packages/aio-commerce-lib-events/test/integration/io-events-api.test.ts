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

import { createAdobeIoEventsApiClient } from "#io-events/index";
import { TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS } from "#test/fixtures/http-client-params";
import { ADOBE_IO_EVENTS_API_PAYLOADS } from "#test/fixtures/io-events-api-payloads";

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";

// Regex for validating base64 encoded strings
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

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
          http.all(makeUrl(payload.pathname), () => HttpResponse.json({})),
        );

        // @ts-expect-error - Testing invalid params
        const invoke = () => client[payload.name]("invalid-params");
        await expect(invoke()).rejects.toThrow();
      },
    );
  });

  describe("event metadata schema validation for sample event template", () => {
    const CONSUMER_ORG_ID = "test-consumer-org-id";
    const PROJECT_ID = "test-project-id";
    const WORKSPACE_ID = "test-workspace-id";
    const PROVIDER_ID = "test-provider-id";

    test("should encode sample event template to base64 in request body", async () => {
      const sampleEventTemplate = {
        name: "product name",
        sku: "1234567890",
        price: 100,
      };

      const capture = { body: null as Record<string, unknown> | null };
      server.use(
        http.all(
          makeUrl(
            `${CONSUMER_ORG_ID}/${PROJECT_ID}/${WORKSPACE_ID}/providers/${PROVIDER_ID}/eventmetadata`,
          ),
          async ({ request }) => {
            capture.body = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json({});
          },
        ),
      );

      await client.createEventMetadataForProvider({
        consumerOrgId: CONSUMER_ORG_ID,
        projectId: PROJECT_ID,
        workspaceId: WORKSPACE_ID,
        providerId: PROVIDER_ID,
        label: "test-label",
        description: "test-description",
        eventCode: "test-event-code",
        sampleEventTemplate,
      });

      if (!capture.body) {
        expect.fail("Captured request body is null");
      }

      expect(capture.body).toHaveProperty("label", "test-label");
      expect(capture.body).toHaveProperty("description", "test-description");
      expect(capture.body).toHaveProperty("event_code", "test-event-code");
      expect(capture.body).toHaveProperty("sample_event_template");

      const encodedTemplate = capture.body.sample_event_template as string;
      expect(encodedTemplate).toBeTypeOf("string");
      expect(encodedTemplate).toMatch(BASE64_REGEX);

      const decodedTemplate = Buffer.from(encodedTemplate, "base64").toString(
        "utf-8",
      );

      const parsedTemplate = JSON.parse(decodedTemplate);
      expect(parsedTemplate).toEqual(sampleEventTemplate);
    });

    test("should handle already base64-encoded sample event template", async () => {
      const sampleEventTemplate = {
        name: "product name",
        sku: "1234567890",
        price: 100,
      };

      const alreadyEncoded = Buffer.from(
        JSON.stringify(sampleEventTemplate),
      ).toString("base64");

      const capture = { body: null as Record<string, unknown> | null };
      server.use(
        http.all(
          makeUrl(
            `${CONSUMER_ORG_ID}/${PROJECT_ID}/${WORKSPACE_ID}/providers/${PROVIDER_ID}/eventmetadata`,
          ),
          async ({ request }) => {
            capture.body = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json({});
          },
        ),
      );

      await client.createEventMetadataForProvider({
        consumerOrgId: CONSUMER_ORG_ID,
        projectId: PROJECT_ID,
        workspaceId: WORKSPACE_ID,
        providerId: PROVIDER_ID,
        label: "test-label",
        description: "test-description",
        eventCode: "test-event-code",
        sampleEventTemplate: alreadyEncoded,
      });

      if (!capture.body) {
        expect.fail("Captured request body is null");
      }

      const encodedTemplate = capture.body.sample_event_template as string;
      const decodedTemplate = Buffer.from(encodedTemplate, "base64").toString(
        "utf-8",
      );

      const parsedTemplate = JSON.parse(decodedTemplate);
      expect(parsedTemplate).toEqual(sampleEventTemplate);
    });

    test("should handle sample event template as JSON string", async () => {
      const sampleEventTemplate = {
        name: "product name",
        sku: "1234567890",
        price: 100,
      };

      const jsonString = JSON.stringify(sampleEventTemplate);
      const capture = { body: null as Record<string, unknown> | null };

      server.use(
        http.all(
          makeUrl(
            `${CONSUMER_ORG_ID}/${PROJECT_ID}/${WORKSPACE_ID}/providers/${PROVIDER_ID}/eventmetadata`,
          ),
          async ({ request }) => {
            capture.body = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json({});
          },
        ),
      );

      await client.createEventMetadataForProvider({
        consumerOrgId: CONSUMER_ORG_ID,
        projectId: PROJECT_ID,
        workspaceId: WORKSPACE_ID,
        providerId: PROVIDER_ID,
        label: "test-label",
        description: "test-description",
        eventCode: "test-event-code",
        sampleEventTemplate: jsonString,
      });

      if (!capture.body) {
        expect.fail("Captured request body is null");
      }

      const encodedTemplate = capture.body.sample_event_template as string;
      const decodedTemplate = Buffer.from(encodedTemplate, "base64").toString(
        "utf-8",
      );

      const parsedTemplate = JSON.parse(decodedTemplate);
      expect(parsedTemplate).toEqual(sampleEventTemplate);
    });
  });
});
