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

import { afterEach, describe, expect, it, vi } from "vitest";

import { getAdminUiSdkPermissionClient } from "#lib/commerce/admin-ui-sdk-permissions/client";
import {
  AdminUiSdkPermissionDeniedError,
  AdminUiSdkPermissionError,
} from "#lib/commerce/admin-ui-sdk-permissions/errors";
import { TestAdobeCommerceHttpClient } from "#test/fixtures/http-clients";

const BASE_URL = "https://commerce.test";
const CHECK_URL = `${BASE_URL}/rest/all/V1/adminuisdk/permission/check`;
type FetchInput = Parameters<typeof fetch>[0];

const clientParams = {
  config: {
    baseUrl: BASE_URL,
    flavor: "paas" as const,
  },
  auth: {
    getHeaders: () => ({ Authorization: "Bearer test-token" }),
  },
  fetchOptions: {
    retry: 0,
  },
};

function makeHttpClient(fetchMock: typeof fetch) {
  return new TestAdobeCommerceHttpClient(clientParams, fetchMock);
}

function readRequestJson(input: FetchInput) {
  if (input instanceof Request) {
    return input.clone().json();
  }

  throw new Error("Expected ky to call fetch with a Request instance");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("client.check — happy path", () => {
  it("posts { resource } and returns true when server responds { allowed: true }", async () => {
    let capturedBody: unknown;
    let capturedUrl = "";
    const fetchMock = vi.fn(async (input: FetchInput) => {
      capturedUrl = input instanceof Request ? input.url : String(input);
      capturedBody = await readRequestJson(input);
      return Response.json({ allowed: true });
    });

    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
    });
    const result = await client.check("Acme_Promotions::dashboard");

    expect(result).toBe(true);
    expect(capturedUrl).toBe(CHECK_URL);
    expect(capturedBody).toEqual({ resource: "Acme_Promotions::dashboard" });
  });

  it("returns false when server responds { allowed: false }", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: false }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
  });
});

describe("client.check — TTL cache", () => {
  it("does not hit the network twice within TTL", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 60_000,
    });

    await client.check("Acme_Promotions::dashboard");
    await client.check("Acme_Promotions::dashboard");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("hits the network again after TTL expires", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 1,
    });

    await client.check("Acme_Promotions::dashboard");
    await new Promise((resolve) => setTimeout(resolve, 10));
    await client.check("Acme_Promotions::dashboard");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent in-flight requests", async () => {
    const fetchMock = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return Response.json({ allowed: true });
    });
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 60_000,
    });

    const [a, b] = await Promise.all([
      client.check("Acme_Promotions::dashboard"),
      client.check("Acme_Promotions::dashboard"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(true);
    expect(b).toBe(true);
  });

  it("invalidate(resource) clears one cache entry", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 60_000,
    });

    await client.check("Acme_Promotions::dashboard");
    client.invalidate("Acme_Promotions::dashboard");
    await client.check("Acme_Promotions::dashboard");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("invalidate() with no argument clears all entries", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 60_000,
    });

    await client.check("Acme_Promotions::dashboard");
    await client.check("Acme_Promotions::edit");
    client.invalidate();
    await client.check("Acme_Promotions::dashboard");
    await client.check("Acme_Promotions::edit");

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("cacheTtlMs: 0 disables caching", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await client.check("Acme_Promotions::dashboard");
    await client.check("Acme_Promotions::dashboard");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache an in-flight response after invalidation", async () => {
    let resolveFirstResponse: (response: Response) => void = () => {
      /* noop — overwritten in the Promise constructor below */
    };
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirstResponse = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce(Response.json({ allowed: false }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 60_000,
    });

    const firstCheck = client.check("Acme_Promotions::dashboard");
    client.invalidate("Acme_Promotions::dashboard");
    resolveFirstResponse(Response.json({ allowed: true }));

    expect(await firstCheck).toBe(true);
    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("client.check — fail-closed (denyOnError: true)", () => {
  it("returns false on 5xx", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ error: "Internal Server Error" }, { status: 500 }),
    );
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
  });

  it("returns false on network error", async () => {
    const fetchMock = vi.fn(() => {
      throw new TypeError("Network error");
    });
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
  });

  it("returns false on schema mismatch", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: "yes" }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
  });

  it("does not cache fail-closed results", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ allowed: true }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
    expect(await client.check("Acme_Promotions::dashboard")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws AdminUiSdkPermissionError on 401 even with denyOnError: true", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.check("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiSdkPermissionError);
  });
});

describe("client.check — denyOnError: false", () => {
  it("throws AdminUiSdkPermissionError on 5xx", async () => {
    const fetchMock = vi.fn(async () => Response.json({}, { status: 500 }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
      denyOnError: false,
    });

    await expect(
      client.check("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiSdkPermissionError);
  });
});

describe("client.require", () => {
  it("resolves when allowed", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).resolves.toBeUndefined();
  });

  it("throws AdminUiSdkPermissionDeniedError when denied", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: false }));
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiSdkPermissionDeniedError);
  });

  it("throws AdminUiSdkPermissionError on 401 even with denyOnError: true", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );
    const client = getAdminUiSdkPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiSdkPermissionError);
  });
});
