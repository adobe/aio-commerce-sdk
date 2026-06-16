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

const { mockState, mockFiles } = vi.hoisted(() => ({
  mockState: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  mockFiles: {
    list: vi.fn(),
    read: vi.fn(),
    write: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("#utils/repository", () => ({
  getSharedState: vi.fn().mockResolvedValue(mockState),
  getSharedFiles: vi.fn().mockResolvedValue(mockFiles),
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
  });

  describe("getSystemConfigByKey", () => {
    test("returns the cached value when present in state", async () => {
      const data = { baseUrl: "https://example.com", env: "saas" };
      mockState.get.mockResolvedValue({ value: wrapForCache(data) });

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toEqual(data);
      expect(mockFiles.list).not.toHaveBeenCalled();
      expect(mockFiles.read).not.toHaveBeenCalled();
    });

    test("falls back to files when cache misses, then re-caches", async () => {
      const data = { baseUrl: "https://example.com", env: "paas" };
      mockState.get.mockResolvedValue({ value: null });
      mockFiles.list.mockResolvedValue([{ name: FILE_PATH }]);
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(data)));

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

    test("returns null when not found in cache or files", async () => {
      mockState.get.mockResolvedValue({ value: null });
      mockFiles.list.mockResolvedValue([]);

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toBeNull();
      expect(mockState.put).not.toHaveBeenCalled();
    });

    test("returns null when state read throws", async () => {
      mockState.get.mockRejectedValue(new Error("state error"));
      mockFiles.list.mockResolvedValue([]);

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toBeNull();
    });

    test("falls back to files when the cached value is corrupt JSON", async () => {
      const data = { baseUrl: "https://example.com", env: "paas" };
      mockState.get.mockResolvedValue({ value: "{not valid json" });
      mockFiles.list.mockResolvedValue([{ name: FILE_PATH }]);
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(data)));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toEqual(data);
      expect(mockFiles.read).toHaveBeenCalledWith(FILE_PATH);
    });

    test("returns null when the persisted file holds corrupt JSON", async () => {
      mockState.get.mockResolvedValue({ value: null });
      mockFiles.list.mockResolvedValue([{ name: FILE_PATH }]);
      mockFiles.read.mockResolvedValue(Buffer.from("{not valid json"));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system-config"
      );

      const result = await getSystemConfigByKey(KEY);

      expect(result).toBeNull();
    });
  });
});
