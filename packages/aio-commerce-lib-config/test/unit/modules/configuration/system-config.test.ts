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

import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockState = new MockState();
let mockFiles = new MockFiles();

vi.mock("#utils/repository", () => ({
  getSharedFiles: vi.fn(async () => mockFiles),
  getSharedState: vi.fn(async () => mockState),
}));

const KEY = "system.association";
const FILE_PATH = "system/system.association.json";

/** Builds the state cache payload exactly as the repository writes it. */
function wrapForCache(value: unknown): string {
  return JSON.stringify({ data: JSON.stringify(value) });
}

describe("system-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = new MockState();
    mockFiles = new MockFiles();
  });

  describe("setSystemConfigByKey", () => {
    test("writes the serialized value to files and caches it in state", async () => {
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const data = { baseUrl: "https://example.com", env: "paas" };
      await setSystemConfigByKey(KEY, data);

      expect(mockFiles.write).toHaveBeenCalledWith(
        FILE_PATH,
        JSON.stringify(data),
      );
      expect(mockState.put).toHaveBeenCalledWith(KEY, wrapForCache(data), {
        ttl: 86_400,
      });
    });

    test("clears both files and state when value is null", async () => {
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      await setSystemConfigByKey(KEY, null);

      expect(mockFiles.delete).toHaveBeenCalledWith(FILE_PATH);
      expect(mockState.delete).toHaveBeenCalledWith(KEY);
      expect(mockFiles.write).not.toHaveBeenCalled();
      expect(mockState.put).not.toHaveBeenCalled();
    });

    test("clears both files and state when value is undefined", async () => {
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      await setSystemConfigByKey(KEY, undefined);

      expect(mockFiles.delete).toHaveBeenCalledWith(FILE_PATH);
      expect(mockState.delete).toHaveBeenCalledWith(KEY);
      expect(mockFiles.write).not.toHaveBeenCalled();
      expect(mockState.put).not.toHaveBeenCalled();
    });

    test("propagates the error when deleting the persisted file fails", async () => {
      mockFiles.delete.mockRejectedValueOnce(new Error("permission denied"));
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      await expect(setSystemConfigByKey(KEY, null)).rejects.toThrow(
        "permission denied",
      );
    });

    test("invalidates the cache entry without throwing when the cache write fails", async () => {
      mockState.put.mockRejectedValueOnce(new Error("cache write failed"));
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      await expect(
        setSystemConfigByKey(KEY, { foo: "bar" }),
      ).resolves.toBeUndefined();

      // Files remain the source of truth, and the stale cache entry is dropped
      // so it can't shadow the freshly persisted value on the next read.
      expect(mockFiles.write).toHaveBeenCalled();
      expect(mockState.delete).toHaveBeenCalledWith(KEY);
    });

    test("forwards a custom cache TTL to state", async () => {
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const data = { baseUrl: "https://example.com", env: "paas" };
      await setSystemConfigByKey(KEY, data, 31_536_000);

      expect(mockState.put).toHaveBeenCalledWith(KEY, wrapForCache(data), {
        ttl: 31_536_000,
      });
    });
  });

  describe("getSystemConfigByKey", () => {
    test("returns the cached value when present in state", async () => {
      const data = { baseUrl: "https://example.com", env: "saas" };
      await mockState.put(KEY, wrapForCache(data));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toEqual(data);
      expect(mockFiles.read).not.toHaveBeenCalled();
    });

    test("falls back to files when cache misses, then re-caches", async () => {
      const data = { baseUrl: "https://example.com", env: "paas" };
      await mockFiles.write(FILE_PATH, JSON.stringify(data));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toEqual(data);
      expect(mockFiles.read).toHaveBeenCalledWith(FILE_PATH);
      expect(mockState.put).toHaveBeenCalledWith(KEY, wrapForCache(data), {
        ttl: 86_400,
      });
    });

    test("re-caches with a custom TTL on the files fallback path", async () => {
      const data = { baseUrl: "https://example.com", env: "paas" };
      await mockFiles.write(FILE_PATH, JSON.stringify(data));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY, 31_536_000);

      expect(result).toEqual(data);
      expect(mockState.put).toHaveBeenCalledWith(KEY, wrapForCache(data), {
        ttl: 31_536_000,
      });
    });

    test("returns null when not found in cache or files", async () => {
      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toBeNull();
      expect(mockState.put).not.toHaveBeenCalled();
    });

    test("returns null when state read throws", async () => {
      mockState.get.mockRejectedValueOnce(new Error("state error"));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toBeNull();
    });

    test("falls back to files when the cached value is corrupt JSON", async () => {
      const data = { baseUrl: "https://example.com", env: "paas" };
      mockState.get.mockResolvedValueOnce({ value: "{not valid json" });
      await mockFiles.write(FILE_PATH, JSON.stringify(data));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toEqual(data);
      expect(mockFiles.read).toHaveBeenCalledWith(FILE_PATH);
    });

    test("returns null when the persisted file holds corrupt JSON", async () => {
      await mockFiles.write(FILE_PATH, "{not valid json");

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toBeNull();
    });
  });
});
