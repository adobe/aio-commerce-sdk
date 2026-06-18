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

import { getAdminUiPermissionClient } from "#api/lib/permission-client";
import { AdminUiPermissionDeniedError, AdminUiPermissionError } from "#errors";
import { BASE_URL, makeHttpClient } from "#test/fixtures/http-client";

const CHECK_URL = `${BASE_URL}/rest/all/V1/adminuisdk/permission/check`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("client.check — happy path", () => {
  it("posts { resource } and returns true when server responds { allowed: true }", async () => {
    let capturedBody: unknown;
    let capturedUrl = "";

    const fetchMock = vi.fn(async (input: Request) => {
      capturedUrl = input.url;
      capturedBody = await input.clone().json();
      return Response.json({ allowed: true });
    });

    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
    });
    const result = await client.check("Acme_Promotions::dashboard");

    expect(result).toBe(true);
    expect(capturedUrl).toBe(CHECK_URL);
    expect(capturedBody).toEqual({ resource: "Acme_Promotions::dashboard" });
  });

  it("returns false when server responds { allowed: false }", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: false }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
  });
});

describe("client.check — TTL cache", () => {
  it("does not hit the network twice within TTL", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 60_000,
    });

    await client.check("Acme_Promotions::dashboard");
    await client.check("Acme_Promotions::dashboard");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("hits the network again after TTL expires", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiPermissionClient({
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
    const client = getAdminUiPermissionClient({
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
    const client = getAdminUiPermissionClient({
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
    const client = getAdminUiPermissionClient({
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
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await client.check("Acme_Promotions::dashboard");
    await client.check("Acme_Promotions::dashboard");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent in-flight requests even when cacheTtlMs is 0", async () => {
    const fetchMock = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return Response.json({ allowed: true });
    });
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    const [a, b] = await Promise.all([
      client.check("Acme_Promotions::dashboard"),
      client.check("Acme_Promotions::dashboard"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(true);
    expect(b).toBe(true);
  });

  it("does not cache an in-flight response after invalidation", async () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: placeholder reassigned inside the Promise constructor
    let resolveFirstResponse: (response: Response) => void = () => {};
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirstResponse = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce(Response.json({ allowed: false }));
    const client = getAdminUiPermissionClient({
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
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
  });

  it("returns false on network error", async () => {
    const fetchMock = vi.fn(() => {
      throw new TypeError("Network error");
    });
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
  });

  it("returns false on schema mismatch", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: "yes" }));
    const client = getAdminUiPermissionClient({
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
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
    });

    expect(await client.check("Acme_Promotions::dashboard")).toBe(false);
    expect(await client.check("Acme_Promotions::dashboard")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws AdminUiPermissionError on 401 even with denyOnError: true", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.check("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiPermissionError);
  });
});

describe("client.check — denyOnError: false", () => {
  it("throws AdminUiPermissionError on 5xx", async () => {
    const fetchMock = vi.fn(async () => Response.json({}, { status: 500 }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
      denyOnError: false,
    });

    await expect(
      client.check("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiPermissionError);
  });
});

describe("client.require", () => {
  it("resolves when allowed", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).resolves.toBeUndefined();
  });

  it("throws AdminUiPermissionDeniedError when denied", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: false }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiPermissionDeniedError);
  });

  it("throws AdminUiPermissionError on 5xx with default denyOnError", async () => {
    const fetchMock = vi.fn(async () => Response.json({}, { status: 500 }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiPermissionError);
    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.not.toBeInstanceOf(AdminUiPermissionDeniedError);
  });

  it("throws AdminUiPermissionError on network error with default denyOnError", async () => {
    const fetchMock = vi.fn(() => {
      throw new TypeError("Network error");
    });
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiPermissionError);
  });

  it("throws AdminUiPermissionError on schema mismatch with default denyOnError", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: "yes" }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiPermissionError);
  });

  it("throws AdminUiPermissionError on 401", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(
      client.require("Acme_Promotions::dashboard"),
    ).rejects.toBeInstanceOf(AdminUiPermissionError);
  });
});

describe("client.check — appId defaulting", () => {
  it("uses getAclResourceId(appId) when resource is omitted", async () => {
    let capturedBody: unknown;

    const fetchMock = vi.fn(async (input: Request) => {
      capturedBody = await input.clone().json();
      return Response.json({ allowed: true });
    });

    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      appId: "acme-promotions",
      cacheTtlMs: 0,
    });

    const result = await client.check();

    expect(result).toBe(true);
    expect(capturedBody).toEqual({
      resource: "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions",
    });
  });

  it("returns false immediately when appId is missing and no resource provided", async () => {
    const fetchMock = vi.fn();
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    expect(await client.check()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("client.require — appId defaulting", () => {
  it("uses getAclResourceId(appId) when resource is omitted", async () => {
    const fetchMock = vi.fn(async () => Response.json({ allowed: true }));
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      appId: "acme-promotions",
      cacheTtlMs: 0,
    });

    await expect(client.require()).resolves.toBeUndefined();
  });

  it("throws AdminUiPermissionError immediately when appId missing and no resource provided", async () => {
    const fetchMock = vi.fn();
    const client = getAdminUiPermissionClient({
      httpClient: makeHttpClient(fetchMock as typeof fetch),
      cacheTtlMs: 0,
    });

    await expect(client.require()).rejects.toBeInstanceOf(
      AdminUiPermissionError,
    );
    await expect(client.require()).rejects.not.toBeInstanceOf(
      AdminUiPermissionDeniedError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
