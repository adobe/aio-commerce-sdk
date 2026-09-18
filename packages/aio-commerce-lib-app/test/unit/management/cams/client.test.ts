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

import { createCamsClient } from "#management/cams/client";
import {
  CamsAdoptConflictError,
  CamsRecordNotFoundError,
  CamsUnavailableError,
} from "#management/cams/errors";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type { ImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
import type AioLogger from "@adobe/aio-lib-core-logging";

const BASE_URL = "https://cams.test";
const ADOPT_URL = `${BASE_URL}/v1/extensions:adopt`;

const IDENTITY = {
  commerceId: "commerce-1",
  extId: "ext-1",
  workspaceId: "workspace-1",
};

setupApiTestLifecycle();

function createMockLogger() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as ReturnType<typeof AioLogger>;
}

const mockAuthProvider: ImsAuthProvider = {
  getAccessToken: () => "test-token",
  getHeaders: () => ({
    Authorization: "Bearer test-token",
    "x-api-key": "client-123",
  }),
};

function createClient(retryDelaysMs: number[] = [0, 0, 0]) {
  return createCamsClient({
    authProvider: mockAuthProvider,
    baseUrl: BASE_URL,
    identity: IDENTITY,
    logger: createMockLogger(),
    retryDelaysMs,
  });
}

describe("createCamsClient", () => {
  describe("ensureAdopted", () => {
    test("returns the record id on 200 and sends the identity + auth headers", async () => {
      let capturedBody: unknown;
      let capturedAuth: string | null = null;

      apiServer.use(
        http.post(ADOPT_URL, async ({ request }) => {
          capturedBody = await request.json();
          capturedAuth = request.headers.get("Authorization");
          return HttpResponse.json({ id: "record-42" });
        }),
      );

      const client = createClient();
      const id = await client.ensureAdopted();

      expect(id).toBe("record-42");
      expect(capturedBody).toEqual(IDENTITY);
      expect(capturedAuth).toBe("Bearer test-token");
    });

    test("adopts at most once across multiple calls (memoized)", async () => {
      const adopt = vi.fn(() => HttpResponse.json({ id: "record-42" }));
      apiServer.use(http.post(ADOPT_URL, adopt));

      const client = createClient();
      const [a, b] = await Promise.all([
        client.ensureAdopted(),
        client.ensureAdopted(),
      ]);

      expect(a).toBe("record-42");
      expect(b).toBe("record-42");
      expect(adopt).toHaveBeenCalledOnce();
    });

    test("retries a retryable 404 and then succeeds", async () => {
      let calls = 0;
      apiServer.use(
        http.post(ADOPT_URL, () => {
          calls += 1;
          if (calls === 1) {
            return HttpResponse.json(
              {
                code: "not-found",
                detail: "not migrated yet",
                retryable: true,
              },
              { status: 404 },
            );
          }
          return HttpResponse.json({ id: "record-42" });
        }),
      );

      const client = createClient();
      await expect(client.ensureAdopted()).resolves.toBe("record-42");
      expect(calls).toBe(2);
    });

    test("throws CamsRecordNotFoundError when 404 persists after retries", async () => {
      let calls = 0;
      apiServer.use(
        http.post(ADOPT_URL, () => {
          calls += 1;
          return HttpResponse.json(
            { code: "not-found", detail: "still missing", retryable: true },
            { status: 404 },
          );
        }),
      );

      const client = createClient([0, 0, 0]);
      await expect(client.ensureAdopted()).rejects.toBeInstanceOf(
        CamsRecordNotFoundError,
      );
      expect(calls).toBe(4); // initial + 3 retries
    });

    test("throws CamsAdoptConflictError on 409 without retrying", async () => {
      let calls = 0;
      apiServer.use(
        http.post(ADOPT_URL, () => {
          calls += 1;
          return HttpResponse.json(
            { code: "owner-conflict", detail: "owned by another client" },
            { status: 409 },
          );
        }),
      );

      const client = createClient();
      await expect(client.ensureAdopted()).rejects.toBeInstanceOf(
        CamsAdoptConflictError,
      );
      expect(calls).toBe(1);
    });

    test("throws CamsUnavailableError when 5xx persists after retries", async () => {
      apiServer.use(
        http.post(ADOPT_URL, () =>
          HttpResponse.json({ detail: "boom" }, { status: 503 }),
        ),
      );

      const client = createClient([0, 0, 0]);
      await expect(client.ensureAdopted()).rejects.toBeInstanceOf(
        CamsUnavailableError,
      );
    });

    test("allows a later call to retry after a failure (no cached rejection)", async () => {
      let calls = 0;
      apiServer.use(
        http.post(ADOPT_URL, () => {
          calls += 1;
          // First invocation (initial + 3 retries) fails; the next succeeds.
          if (calls <= 4) {
            return HttpResponse.json({ detail: "down" }, { status: 503 });
          }
          return HttpResponse.json({ id: "record-42" });
        }),
      );

      const client = createClient([0, 0, 0]);
      await expect(client.ensureAdopted()).rejects.toBeInstanceOf(
        CamsUnavailableError,
      );
      await expect(client.ensureAdopted()).resolves.toBe("record-42");
    });
  });

  describe("owner-gated writes", () => {
    test("postStatus adopts first, then posts to the record's status endpoint", async () => {
      let statusBody: unknown;
      apiServer.use(
        http.post(ADOPT_URL, () => HttpResponse.json({ id: "record-42" })),
        http.post(
          `${BASE_URL}/v1/extensions/record-42/status`,
          async ({ request }) => {
            statusBody = await request.json();
            return HttpResponse.json({}, { status: 201 });
          },
        ),
      );

      const client = createClient();
      await client.postStatus({ status: "INSTALLED", version: "1.0.0" });

      expect(statusBody).toEqual({ status: "INSTALLED", version: "1.0.0" });
    });

    test("patchConfig adopts first, then patches the record", async () => {
      let patchBody: unknown;
      apiServer.use(
        http.post(ADOPT_URL, () => HttpResponse.json({ id: "record-42" })),
        http.patch(
          `${BASE_URL}/v1/extensions/record-42`,
          async ({ request }) => {
            patchBody = await request.json();
            return HttpResponse.json({});
          },
        ),
      );

      const client = createClient();
      await client.patchConfig({ foo: "bar" });

      expect(patchBody).toEqual({ appConfig: { foo: "bar" } });
    });
  });
});
