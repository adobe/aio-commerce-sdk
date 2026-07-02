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

import { enableAdminUiSdk } from "#api/config/endpoints";
import { BASE_URL, makeHttpClient } from "#test/fixtures/http-client";

const CONFIG_URL = `${BASE_URL}/rest/all/V1/adminuisdk/config`;

describe("enableAdminUiSdk", () => {
  it("PUTs { enableAdminUiSdk: true } to /V1/adminuisdk/config and returns the response", async () => {
    let capturedBody: unknown;
    let capturedUrl = "";
    let capturedMethod = "";

    const fetchMock = vi.fn(async (input: Request) => {
      capturedUrl = input.url;
      capturedMethod = input.method;
      capturedBody = await input.clone().json();
      return Response.json(true, { status: 200 });
    });

    const result = await enableAdminUiSdk(
      makeHttpClient(fetchMock as typeof fetch),
    );

    expect(result).toBe(true);
    expect(capturedMethod).toBe("PUT");
    expect(capturedUrl).toBe(CONFIG_URL);
    expect(capturedBody).toEqual({ enableAdminUiSdk: true });
  });

  it("throws on non-2xx response", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );

    await expect(
      enableAdminUiSdk(makeHttpClient(fetchMock as typeof fetch)),
    ).rejects.toThrow();
  });
});
