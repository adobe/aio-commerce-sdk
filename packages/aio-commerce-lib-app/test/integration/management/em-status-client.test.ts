/*
 * Copyright 2026 Adobe. All rights reserved.
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
import { describe, expect, test, vi } from "vitest";

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

import { createEmStatusClient } from "#management/upgrade/em-status-client";
import { DEFAULT_INSTALLATION_IMS_PARAMS } from "#test/fixtures/installation";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type { WriteUpdateStatusInput } from "#management/upgrade/em-status-client";

setupApiTestLifecycle();

const BASE_URL = "https://em.example.com";
const EXTENSION_ID = "test-extension-id";
const FAKE_TIMESTAMP = "2026-01-30T10:00:00.000Z";

function makeUrl() {
  return `${BASE_URL}/v2/extensions/${EXTENSION_ID}/update-status`;
}

describe("createEmStatusClient", () => {
  const client = createEmStatusClient({
    auth: DEFAULT_INSTALLATION_IMS_PARAMS,
    baseUrl: BASE_URL,
  });

  const STATUS_CASES: Array<{
    name: string;
    input: WriteUpdateStatusInput;
    expectedBody: Record<string, unknown>;
  }> = [
    {
      expectedBody: { status: "UPDATING", timestamp: FAKE_TIMESTAMP },
      input: {
        extensionId: EXTENSION_ID,
        status: "UPDATING",
        timestamp: FAKE_TIMESTAMP,
      },
      name: "UPDATING",
    },
    {
      expectedBody: {
        deploymentVersion: "3",
        status: "INSTALLED",
        timestamp: FAKE_TIMESTAMP,
        version: "1.2.0",
      },
      input: {
        deploymentVersion: "3",
        extensionId: EXTENSION_ID,
        status: "INSTALLED",
        timestamp: FAKE_TIMESTAMP,
        version: "1.2.0",
      },
      name: "INSTALLED",
    },
    {
      expectedBody: {
        error: { message: "Something went wrong" },
        status: "UPDATE_FAILED",
        timestamp: FAKE_TIMESTAMP,
      },
      input: {
        error: { message: "Something went wrong" },
        extensionId: EXTENSION_ID,
        status: "UPDATE_FAILED",
        timestamp: FAKE_TIMESTAMP,
      },
      name: "UPDATE_FAILED",
    },
    {
      expectedBody: {
        status: "UPDATE_REVIEW_REQUIRED",
        timestamp: FAKE_TIMESTAMP,
      },
      input: {
        extensionId: EXTENSION_ID,
        status: "UPDATE_REVIEW_REQUIRED",
        timestamp: FAKE_TIMESTAMP,
      },
      name: "UPDATE_REVIEW_REQUIRED",
    },
  ];

  describe.each(STATUS_CASES)("$name", ({ input, expectedBody }) => {
    test("sends a PATCH request with the auth header, path, and body shape", async () => {
      const capture = {
        body: null as Record<string, unknown> | null,
        headers: null as Headers | null,
        method: null as string | null,
      };

      apiServer.use(
        http.patch(makeUrl(), async ({ request }) => {
          capture.method = request.method;
          capture.headers = request.headers;
          capture.body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({});
        }),
      );

      await client.writeUpdateStatus(input);

      expect(capture.method).toBe("PATCH");
      expect.assert(capture.headers);
      expect(capture.headers.get("Authorization")).toBe(
        "Bearer supersecrettoken",
      );

      expect(capture.body).toEqual(expectedBody);
    });
  });

  test("rejects when the endpoint responds with a non-2xx status", async () => {
    apiServer.use(
      http.patch(makeUrl(), () => HttpResponse.json({}, { status: 500 })),
    );

    await expect(
      client.writeUpdateStatus({
        extensionId: EXTENSION_ID,
        status: "UPDATING",
        timestamp: FAKE_TIMESTAMP,
      }),
    ).rejects.toThrow();
  });

  test("falls back to the placeholder base URL when none is provided", async () => {
    const defaultClient = createEmStatusClient({
      auth: DEFAULT_INSTALLATION_IMS_PARAMS,
    });

    const capture = { url: null as string | null };
    apiServer.use(
      http.patch(
        `https://placeholder-em.adobe.io/v2/extensions/${EXTENSION_ID}/update-status`,
        ({ request }) => {
          capture.url = request.url;
          return HttpResponse.json({});
        },
      ),
    );

    await defaultClient.writeUpdateStatus({
      extensionId: EXTENSION_ID,
      status: "UPDATING",
      timestamp: FAKE_TIMESTAMP,
    });

    expect(capture.url).toBe(
      `https://placeholder-em.adobe.io/v2/extensions/${EXTENSION_ID}/update-status`,
    );
  });
});
