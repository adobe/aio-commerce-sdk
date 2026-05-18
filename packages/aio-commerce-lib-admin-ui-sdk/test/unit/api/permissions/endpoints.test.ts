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

import { describe, expect, it, vi } from "vitest";

import { checkPermission } from "#api/permissions/endpoints";
import { BASE_URL, makeHttpClient } from "#test/fixtures/http-client";

const CHECK_URL = `${BASE_URL}/rest/all/V1/adminuisdk/permission/check`;

describe("checkPermission", () => {
  it("POSTs { resource } to /V1/adminuisdk/permission/check and returns { allowed: true }", async () => {
    let capturedBody: unknown;
    let capturedUrl = "";

    const fetchMock = vi.fn(async (input: Request) => {
      capturedUrl = input.url;
      capturedBody = await input.clone().json();
      return Response.json({ allowed: true });
    });

    const result = await checkPermission(
      makeHttpClient(fetchMock as typeof fetch),
      {
        resource: "Acme_Promotions::dashboard",
      },
    );

    expect(result).toEqual({ allowed: true });
    expect(capturedUrl).toBe(CHECK_URL);
    expect(capturedBody).toEqual({ resource: "Acme_Promotions::dashboard" });
  });

  it("returns { allowed: false } when server responds with false", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: false }));

    const result = await checkPermission(
      makeHttpClient(fetchMock as typeof fetch),
      {
        resource: "Acme_Promotions::dashboard",
      },
    );

    expect(result).toEqual({ allowed: false });
  });

  it("throws on non-2xx response", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );

    await expect(
      checkPermission(makeHttpClient(fetchMock as typeof fetch), {
        resource: "Acme_Promotions::dashboard",
      }),
    ).rejects.toThrow();
  });
});
