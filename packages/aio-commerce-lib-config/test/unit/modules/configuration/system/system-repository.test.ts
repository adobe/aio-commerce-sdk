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

describe("system-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setSystemConfigByKey", () => {
    test("writes the serialized value to both files and state", async () => {
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const data = { baseUrl: "https://example.com", env: "paas" };
      await setSystemConfigByKey("system.association", data);

      expect(mockFiles.write).toHaveBeenCalledWith(
        "system/system.association.json",
        JSON.stringify(data),
      );
      expect(mockState.put).toHaveBeenCalledWith(
        "system.association",
        JSON.stringify(data),
      );
    });

    test("clears both files and state when value is null", async () => {
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      await setSystemConfigByKey("system.association", null);

      expect(mockFiles.delete).toHaveBeenCalledWith(
        "system/system.association.json",
      );
      expect(mockState.delete).toHaveBeenCalledWith("system.association");
      expect(mockFiles.write).not.toHaveBeenCalled();
      expect(mockState.put).not.toHaveBeenCalled();
    });

    test("invalidates the cache entry without throwing when the cache write fails", async () => {
      mockState.put.mockRejectedValueOnce(new Error("cache write failed"));
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      await expect(
        setSystemConfigByKey("system.association", { foo: "bar" }),
      ).resolves.toBeUndefined();

      // Files remain the source of truth, and the stale cache entry is dropped
      // so it can't shadow the freshly persisted value on the next read.
      expect(mockFiles.write).toHaveBeenCalled();
      expect(mockState.delete).toHaveBeenCalledWith("system.association");
    });

    test("clears both files and state when value is undefined", async () => {
      const { setSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      await setSystemConfigByKey("system.association", undefined);

      expect(mockFiles.delete).toHaveBeenCalledWith(
        "system/system.association.json",
      );
      expect(mockState.delete).toHaveBeenCalledWith("system.association");
      expect(mockFiles.write).not.toHaveBeenCalled();
      expect(mockState.put).not.toHaveBeenCalled();
    });
  });

  describe("getSystemConfigByKey", () => {
    test("returns the cached value when present in state", async () => {
      const data = { baseUrl: "https://example.com", env: "saas" };
      mockState.get.mockResolvedValue({ value: JSON.stringify(data) });

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const result = await getSystemConfigByKey("system.association");

      expect(result).toEqual(data);
      expect(mockFiles.list).not.toHaveBeenCalled();
      expect(mockFiles.read).not.toHaveBeenCalled();
    });

    test("falls back to files when cache miss, then re-caches", async () => {
      const data = { baseUrl: "https://example.com", env: "paas" };
      mockState.get.mockResolvedValue({ value: null });
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(data)));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const result = await getSystemConfigByKey("system.association");

      expect(result).toEqual(data);
      expect(mockFiles.read).toHaveBeenCalledWith(
        "system/system.association.json",
      );
      expect(mockState.put).toHaveBeenCalledWith(
        "system.association",
        JSON.stringify(data),
      );
    });

    test("returns null when not found in cache or files", async () => {
      mockState.get.mockResolvedValue({ value: null });
      mockFiles.read.mockRejectedValue(new Error("file not found"));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const result = await getSystemConfigByKey("system.association");

      expect(result).toBeNull();
      expect(mockState.put).not.toHaveBeenCalled();
    });

    test("returns null when state read throws", async () => {
      mockState.get.mockRejectedValue(new Error("state error"));
      mockFiles.list.mockResolvedValue([]);

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const result = await getSystemConfigByKey("system.association");

      expect(result).toBeNull();
    });

    test("returns null when files read throws", async () => {
      mockState.get.mockResolvedValue({ value: null });
      mockFiles.read.mockRejectedValue(new Error("files error"));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const result = await getSystemConfigByKey("system.association");

      expect(result).toBeNull();
    });

    test("falls back to files when the cached value is corrupt JSON", async () => {
      const data = { baseUrl: "https://example.com", env: "paas" };
      mockState.get.mockResolvedValue({ value: "{not valid json" });
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(data)));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const result = await getSystemConfigByKey("system.association");

      expect(result).toEqual(data);
      expect(mockFiles.read).toHaveBeenCalledWith(
        "system/system.association.json",
      );
      expect(mockState.put).toHaveBeenCalledWith(
        "system.association",
        JSON.stringify(data),
      );
    });

    test("returns null when the persisted file holds corrupt JSON", async () => {
      mockState.get.mockResolvedValue({ value: null });
      mockFiles.read.mockResolvedValue(Buffer.from("{not valid json"));

      const { getSystemConfigByKey } = await import(
        "#modules/configuration/system/system-repository"
      );

      const result = await getSystemConfigByKey("system.association");

      expect(result).toBeNull();
      expect(mockState.put).not.toHaveBeenCalled();
    });
  });
});
