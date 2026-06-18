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

import { MAX_SYSTEM_CONFIG_CACHE_TTL_SECONDS } from "@adobe/aio-commerce-lib-config";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the underlying storage layer (`aio-lib-state` / `aio-lib-files`) rather
// than the `system-config` helpers the repository calls, so the real config
// code path runs and the test exercises actual round-trip storage behavior.
const { state, files, mockState, mockFiles } = vi.hoisted(() => {
  const state = new Map<string, string>();
  const files = new Map<string, string>();

  const mockState = {
    get: vi.fn(async (key: string) => ({ value: state.get(key) ?? null })),
    put: vi.fn(
      async (key: string, value: string, _options?: { ttl?: number }) => {
        state.set(key, value);
      },
    ),
    delete: vi.fn(async (key: string) => {
      state.delete(key);
    }),
  };

  const mockFiles = {
    read: vi.fn(async (path: string) => {
      const content = files.get(path);
      if (content === undefined) {
        throw Object.assign(new Error(`ENOENT: ${path}`), { code: "ENOENT" });
      }
      return Buffer.from(content);
    }),
    write: vi.fn(async (path: string, content: string | Buffer) => {
      const contentString = content.toString();
      files.set(path, contentString);
      return contentString.length;
    }),
    delete: vi.fn(async (path: string) => {
      files.delete(path);
    }),
  };

  return { state, files, mockState, mockFiles };
});

vi.mock("@adobe/aio-lib-state", () => ({
  init: vi.fn(async () => mockState),
}));

vi.mock("@adobe/aio-lib-files", () => ({
  init: vi.fn(async () => mockFiles),
}));

import {
  clearAssociationData,
  getAssociationData,
  setAssociationData,
} from "#management/association/association-repository";

describe("association-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.clear();
    files.clear();
  });

  test("stores association data and reads it back unchanged", async () => {
    const data = { baseUrl: "https://example.com", env: "paas" as const };
    await setAssociationData(data);

    expect(await getAssociationData()).toEqual(data);
  });

  test("returns null when no association data has been stored", async () => {
    expect(await getAssociationData()).toBeNull();
  });

  test("overwrites previously stored association data", async () => {
    await setAssociationData({
      baseUrl: "https://first.example.com",
      env: "paas",
    });

    const updated = {
      baseUrl: "https://second.example.com",
      env: "saas" as const,
    };
    await setAssociationData(updated);

    expect(await getAssociationData()).toEqual(updated);
  });

  test("clears stored association data", async () => {
    await setAssociationData({ baseUrl: "https://example.com", env: "saas" });
    await clearAssociationData();

    expect(await getAssociationData()).toBeNull();
  });

  test("caches association data with the maximum TTL", async () => {
    await setAssociationData({ baseUrl: "https://example.com", env: "paas" });

    expect(mockState.put).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { ttl: MAX_SYSTEM_CONFIG_CACHE_TTL_SECONDS },
    );
  });

  test("re-caches with the maximum TTL when falling back to files", async () => {
    const data = { baseUrl: "https://example.com", env: "paas" as const };
    await setAssociationData(data);

    // Drop only the cache entry so the next read falls back to files and
    // re-caches; the persisted file remains the source of truth.
    state.clear();
    mockState.put.mockClear();

    expect(await getAssociationData()).toEqual(data);
    expect(mockState.put).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { ttl: MAX_SYSTEM_CONFIG_CACHE_TTL_SECONDS },
    );
  });
});
