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

import {
  registerExtension,
  unregisterExtension,
} from "#api/extensions/endpoints";
import { BASE_URL, makeHttpClient } from "#test/fixtures/http-client";

const REGISTER_URL = `${BASE_URL}/rest/all/V1/adminuisdk/extension`;
const UNREGISTER_URL = `${BASE_URL}/rest/all/V1/adminuisdk/extension/prod-workspace/my-namespace`;

const PARAMS = {
  extensionName: "my-namespace",
  extensionTitle: "My App",
  extensionUrl: "https://my-namespace.adobeio-static.net/index.html",
  extensionWorkspace: "prod-workspace",
};

describe("registerExtension", () => {
  it("POSTs to /V1/adminuisdk/extension with extension body and resolves without reading a response body", async () => {
    let capturedBody: unknown;
    let capturedUrl = "";

    const fetchMock = vi.fn(async (input: Request) => {
      capturedUrl = input.url;
      capturedBody = await input.clone().json();
      return new Response(null, { status: 204 });
    });

    const result = await registerExtension(
      makeHttpClient(fetchMock as typeof fetch),
      PARAMS,
    );

    expect(result).toBeUndefined();
    expect(capturedUrl).toBe(REGISTER_URL);
    expect(capturedBody).toEqual({ extension: PARAMS });
  });

  it("throws on non-2xx response", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );

    await expect(
      registerExtension(makeHttpClient(fetchMock as typeof fetch), PARAMS),
    ).rejects.toThrow();
  });
});

describe("unregisterExtension", () => {
  it("sends DELETE to /V1/adminuisdk/extension/{workspaceName}/{extensionName}", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    const fetchMock = vi.fn((input: Request) => {
      capturedUrl = input.url;
      capturedMethod = input.method;
      return Promise.resolve(new Response(null, { status: 200 }));
    });

    await unregisterExtension(makeHttpClient(fetchMock as typeof fetch), {
      workspaceName: "prod-workspace",
      extensionName: "my-namespace",
    });

    expect(capturedMethod).toBe("DELETE");
    expect(capturedUrl).toBe(UNREGISTER_URL);
  });

  it("throws on non-2xx response", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Not Found" }, { status: 404 }),
    );

    await expect(
      unregisterExtension(makeHttpClient(fetchMock as typeof fetch), {
        workspaceName: "prod-workspace",
        extensionName: "my-namespace",
      }),
    ).rejects.toThrow();
  });
});
