/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import stringify from "safe-stable-stringify";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  deleteCachedScopeTree,
  getCachedScopeTree,
  getPersistedScopeTree,
  saveScopeTree,
  setCachedScopeTree,
} from "#modules/scope-tree/scope-tree-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockStateInstance = new MockState();
let mockFilesInstance = new MockFiles();

vi.mock("#utils/repository", () => ({
  getSharedState: vi.fn(async () => mockStateInstance),
  getSharedFiles: vi.fn(async () => mockFilesInstance),
}));

describe("scope-tree/scope-tree-repository", () => {
  beforeEach(() => {
    mockStateInstance = new MockState();
    mockFilesInstance = new MockFiles();
    vi.clearAllMocks();
  });

  describe("getCachedScopeTree", () => {
    test("should return cached scope tree when present", async () => {
      await mockStateInstance.put(
        "test-namespace:scope-tree",
        JSON.stringify({ data: mockScopeTree }),
      );

      const result = await getCachedScopeTree("test-namespace");
      expect(result).toEqual(mockScopeTree);
    });

    test("should return null when cache is empty", async () => {
      const result = await getCachedScopeTree("test-namespace");
      expect(result).toBeNull();
    });

    test("should return null when cache value is invalid JSON", async () => {
      await mockStateInstance.put("test-namespace:scope-tree", "invalid-json");

      const result = await getCachedScopeTree("test-namespace");
      expect(result).toBeNull();
    });

    test("should return null when data property is missing", async () => {
      await mockStateInstance.put(
        "test-namespace:scope-tree",
        JSON.stringify({ other: "value" }),
      );

      const result = await getCachedScopeTree("test-namespace");
      expect(result).toBeNull();
    });
  });

  describe("setCachedScopeTree", () => {
    test("should cache scope tree with TTL", async () => {
      const ttl = 300;

      await setCachedScopeTree("test-namespace", mockScopeTree, ttl);
      expect(mockStateInstance.put).toHaveBeenCalledWith(
        "test-namespace:scope-tree",
        stringify({ data: mockScopeTree }),
        { ttl },
      );

      const cached = await mockStateInstance.get("test-namespace:scope-tree");
      expect.assert.isNotNull(cached.value);

      const parsed = JSON.parse(cached.value);
      expect(parsed.data).toEqual(mockScopeTree);
    });

    test("should not throw when caching fails", async () => {
      vi.spyOn(mockStateInstance, "put").mockRejectedValue(
        new Error("State error"),
      );

      await expect(
        setCachedScopeTree("test-namespace", mockScopeTree, 300),
      ).resolves.not.toThrow();
    });
  });

  describe("deleteCachedScopeTree", () => {
    test("should delete cached scope tree", async () => {
      await mockStateInstance.put(
        "test-namespace:scope-tree",
        JSON.stringify({ data: mockScopeTree }),
      );

      await deleteCachedScopeTree("test-namespace");

      const cached = await mockStateInstance.get("test-namespace:scope-tree");
      expect(cached?.value).toBeNull();
    });

    test("should not throw when deletion fails", async () => {
      vi.spyOn(mockStateInstance, "delete").mockRejectedValue(
        new Error("Delete error"),
      );

      await expect(
        deleteCachedScopeTree("test-namespace"),
      ).resolves.not.toThrow();
    });
  });

  describe("getPersistedScopeTree", () => {
    test("should return scope tree from file when present", async () => {
      await mockFilesInstance.write(
        "test-namespace/scope-tree.json",
        JSON.stringify({
          scopes: mockScopeTree,
          lastUpdated: new Date().toISOString(),
          version: "1.0",
        }),
      );

      const result = await getPersistedScopeTree("test-namespace");
      expect(result).toEqual(mockScopeTree);
    });

    test("should create and return initial tree when file does not exist", async () => {
      vi.spyOn(mockFilesInstance, "read").mockRejectedValue(
        new Error("File not found"),
      );

      const result = await getPersistedScopeTree("test-namespace");

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("global");
      expect(result[0].level).toBe("global");

      // Verify the initial tree was persisted
      expect(mockFilesInstance.write).toHaveBeenCalledWith(
        "test-namespace/scope-tree.json",
        expect.any(String),
      );
    });

    test("should return initial tree as fallback when persisting also fails", async () => {
      vi.spyOn(mockFilesInstance, "read").mockRejectedValue(
        new Error("File not found"),
      );

      vi.spyOn(mockFilesInstance, "write").mockRejectedValue(
        new Error("Write error"),
      );

      const result = await getPersistedScopeTree("test-namespace");

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("global");
    });
  });

  describe("saveScopeTree", () => {
    test("should save scope tree to file with correct format", async () => {
      await saveScopeTree("test-namespace", mockScopeTree);
      const saved = await mockFilesInstance.read(
        "test-namespace/scope-tree.json",
      );

      const parsed = JSON.parse(saved.toString());

      expect(parsed.scopes).toEqual(mockScopeTree);
      expect(parsed.version).toBe("1.0");
      expect(parsed.lastUpdated).toBeDefined();
    });

    test("should throw when writing to file fails", async () => {
      vi.spyOn(mockFilesInstance, "write").mockRejectedValue(
        new Error("Write error"),
      );

      await expect(
        saveScopeTree("test-namespace", mockScopeTree),
      ).rejects.toThrow("Write error");
    });
  });
});
