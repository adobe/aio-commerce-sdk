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

import { beforeEach, describe, expect, test, vi } from "vitest";

// `aio-lib-state`'s MAX_TTL (one year); the repository caches association data
// at this value.
const MAX_TTL = 31_536_000;

// Mock the underlying storage layer (`aio-lib-state` / `aio-lib-files`) rather
// than the `system-config` helpers the repository calls, so the real config
// code path runs and the test exercises actual round-trip storage behavior.
const { state, files, mockState, mockFiles } = vi.hoisted(() => {
  const stateStore = new Map<string, string>();
  const filesStore = new Map<string, string>();

  const stateMock = {
    delete: vi.fn(async (key: string) => {
      stateStore.delete(key);
    }),
    get: vi.fn(async (key: string) => ({
      value: stateStore.get(key) ?? null,
    })),
    put: vi.fn(
      async (key: string, value: string, _options?: { ttl?: number }) => {
        stateStore.set(key, value);
      },
    ),
  };

  const filesMock = {
    delete: vi.fn(async (path: string) => {
      filesStore.delete(path);
    }),
    read: vi.fn(async (path: string) => {
      const content = filesStore.get(path);
      if (content === undefined) {
        throw Object.assign(new Error(`ENOENT: ${path}`), { code: "ENOENT" });
      }
      return Buffer.from(content);
    }),
    write: vi.fn(async (path: string, content: string | Buffer) => {
      const contentString = content.toString();
      filesStore.set(path, contentString);
      return contentString.length;
    }),
  };

  return {
    files: filesStore,
    mockFiles: filesMock,
    mockState: stateMock,
    state: stateStore,
  };
});

vi.mock("@adobe/aio-lib-state", () => ({
  init: vi.fn(async () => mockState),
  MAX_TTL: 31_536_000,
}));

vi.mock("@adobe/aio-lib-files", () => ({
  init: vi.fn(async () => mockFiles),
}));

import {
  clearAssociationData,
  getAssociationData,
  setAssociationData,
} from "#management/association/association-repository";

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";

const metadata = {
  description: "Test app",
  displayName: "Test App",
  id: "test-app",
  version: "1.0.0",
};

const makeData = (baseUrl: string, env: CommerceEnv) => ({
  app: { metadata },
  commerce: { baseUrl, env },
});

describe("association-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.clear();
    files.clear();
  });

  test("stores association data and reads it back unchanged", async () => {
    const data = makeData("https://example.com", "paas");
    await setAssociationData(data);

    expect(await getAssociationData()).toEqual(data);
  });

  test("returns null when no association data has been stored", async () => {
    expect(await getAssociationData()).toBeNull();
  });

  test("overwrites previously stored association data", async () => {
    await setAssociationData(makeData("https://first.example.com", "paas"));

    const updated = makeData("https://second.example.com", "saas");
    await setAssociationData(updated);

    expect(await getAssociationData()).toEqual(updated);
  });

  test("clears stored association data", async () => {
    await setAssociationData(makeData("https://example.com", "saas"));
    await clearAssociationData();

    expect(await getAssociationData()).toBeNull();
  });

  test("caches association data with the maximum TTL", async () => {
    await setAssociationData(makeData("https://example.com", "paas"));

    expect(mockState.put).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {
        ttl: MAX_TTL,
      },
    );
  });

  test("re-caches with the maximum TTL when falling back to files", async () => {
    const data = makeData("https://example.com", "paas");
    await setAssociationData(data);

    // Drop only the cache entry so the next read falls back to files and
    // re-caches; the persisted file remains the source of truth.
    state.clear();
    mockState.put.mockClear();

    expect(await getAssociationData()).toEqual(data);
    expect(mockState.put).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { ttl: MAX_TTL },
    );
  });
});
