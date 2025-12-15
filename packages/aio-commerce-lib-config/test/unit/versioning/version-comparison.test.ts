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

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  compareTwoVersions,
  getVersionComparison,
} from "#modules/versioning/version-comparison";

import type { ConfigValue } from "#modules/configuration/types";
import type { ConfigVersion, VersionContext } from "#modules/versioning/types";

// Mock the version repository
vi.mock("#modules/versioning/version-repository", () => ({
  getVersion: vi.fn(),
}));

// Helper to cast values to ConfigValue type
const asConfigValue = (value: unknown) => value as ConfigValue["value"];

describe("Version Comparison", () => {
  const context: VersionContext = {
    namespace: "test-namespace",
    maxVersions: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVersionComparison", () => {
    it("should return before/after comparison for a version", async () => {
      const { getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      const mockVersion: ConfigVersion = {
        id: "version-1",
        scope: { id: "scope-1", code: "global", level: "global" },
        snapshot: [
          {
            name: "field1",
            value: "new-value",
            origin: { code: "global", level: "global" },
          },
          {
            name: "field2",
            value: "value2",
            origin: { code: "global", level: "global" },
          },
        ],
        diff: [
          {
            name: "field1",
            oldValue: "old-value",
            newValue: "new-value",
            type: "modified",
          },
        ],
        timestamp: "2025-01-01T00:00:00Z",
        previousVersionId: null,
        versionNumber: 1,
      };

      vi.mocked(getVersion).mockResolvedValue(mockVersion);

      const result = await getVersionComparison(context, "global", "version-1");

      expect(result).not.toBeNull();
      expect(result?.version).toEqual(mockVersion);
      expect(result?.after).toEqual(mockVersion.snapshot);
      expect(result?.before).toHaveLength(2);

      // Check that before state has the old value
      const field1Before = result?.before.find((f) => f.name === "field1");
      expect(field1Before?.value).toBe("old-value");
    });

    it("should handle added fields in diff", async () => {
      const { getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      const mockVersion: ConfigVersion = {
        id: "version-1",
        scope: { id: "scope-1", code: "global", level: "global" },
        snapshot: [
          {
            name: "field1",
            value: "value1",
            origin: { code: "global", level: "global" },
          },
          {
            name: "field2",
            value: "value2",
            origin: { code: "global", level: "global" },
          },
        ],
        diff: [
          {
            name: "field2",
            newValue: "value2",
            type: "added",
          },
        ],
        timestamp: "2025-01-01T00:00:00Z",
        previousVersionId: null,
        versionNumber: 1,
      };

      vi.mocked(getVersion).mockResolvedValue(mockVersion);

      const result = await getVersionComparison(context, "global", "version-1");

      expect(result).not.toBeNull();
      // Before state should not have field2 (it was added)
      expect(result?.before).toHaveLength(1);
      expect(result?.before.find((f) => f.name === "field2")).toBeUndefined();
    });

    it("should handle removed fields in diff", async () => {
      const { getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      const mockVersion: ConfigVersion = {
        id: "version-1",
        scope: { id: "scope-1", code: "global", level: "global" },
        snapshot: [
          {
            name: "field1",
            value: "value1",
            origin: { code: "global", level: "global" },
          },
        ],
        diff: [
          {
            name: "field2",
            oldValue: "value2",
            type: "removed",
          },
        ],
        timestamp: "2025-01-01T00:00:00Z",
        previousVersionId: null,
        versionNumber: 1,
      };

      vi.mocked(getVersion).mockResolvedValue(mockVersion);

      const result = await getVersionComparison(context, "global", "version-1");

      expect(result).not.toBeNull();
      // Before state should have field2 (it was removed)
      expect(result?.before).toHaveLength(2);
      const field2Before = result?.before.find((f) => f.name === "field2");
      expect(field2Before?.value).toBe("value2");
    });

    it("should return null if version not found", async () => {
      const { getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getVersion).mockResolvedValue(null);

      const result = await getVersionComparison(
        context,
        "global",
        "nonexistent",
      );

      expect(result).toBeNull();
    });
  });

  describe("compareTwoVersions", () => {
    it("should compare two versions and show all differences", async () => {
      const { getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      const version5: ConfigVersion = {
        id: "version-5",
        scope: { id: "scope-1", code: "global", level: "global" },
        snapshot: [
          {
            name: "field1",
            value: "value1-v5",
            origin: { code: "global", level: "global" },
          },
          {
            name: "field2",
            value: asConfigValue(100),
            origin: { code: "global", level: "global" },
          },
        ],
        diff: [],
        timestamp: "2025-01-05T00:00:00Z",
        previousVersionId: "version-4",
        versionNumber: 5,
      };

      const version10: ConfigVersion = {
        id: "version-10",
        scope: { id: "scope-1", code: "global", level: "global" },
        snapshot: [
          {
            name: "field1",
            value: "value1-v10",
            origin: { code: "global", level: "global" },
          },
          {
            name: "field2",
            value: asConfigValue(200),
            origin: { code: "global", level: "global" },
          },
          {
            name: "field3",
            value: "new-field",
            origin: { code: "global", level: "global" },
          },
        ],
        diff: [],
        timestamp: "2025-01-10T00:00:00Z",
        previousVersionId: "version-9",
        versionNumber: 10,
      };

      vi.mocked(getVersion)
        .mockResolvedValueOnce(version5)
        .mockResolvedValueOnce(version10);

      const result = await compareTwoVersions(
        context,
        "global",
        "version-5",
        "version-10",
      );

      expect(result).not.toBeNull();
      expect(result?.fromVersion).toEqual(version5);
      expect(result?.toVersion).toEqual(version10);
      expect(result?.fromConfig).toEqual(version5.snapshot);
      expect(result?.toConfig).toEqual(version10.snapshot);

      // Should have 3 changes: field1 modified, field2 modified, field3 added
      expect(result?.changes).toHaveLength(3);

      const field1Change = result?.changes.find((c) => c.name === "field1");
      expect(field1Change?.type).toBe("modified");
      expect(field1Change?.oldValue).toBe("value1-v5");
      expect(field1Change?.newValue).toBe("value1-v10");

      const field3Change = result?.changes.find((c) => c.name === "field3");
      expect(field3Change?.type).toBe("added");
      expect(field3Change?.newValue).toBe("new-field");
    });

    it("should return null if either version not found", async () => {
      const { getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getVersion)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await compareTwoVersions(
        context,
        "global",
        "nonexistent-1",
        "nonexistent-2",
      );

      expect(result).toBeNull();
    });

    it("should handle comparing identical versions", async () => {
      const { getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      const version: ConfigVersion = {
        id: "version-1",
        scope: { id: "scope-1", code: "global", level: "global" },
        snapshot: [
          {
            name: "field1",
            value: "value1",
            origin: { code: "global", level: "global" },
          },
        ],
        diff: [],
        timestamp: "2025-01-01T00:00:00Z",
        previousVersionId: null,
        versionNumber: 1,
      };

      vi.mocked(getVersion)
        .mockResolvedValueOnce(version)
        .mockResolvedValueOnce(version);

      const result = await compareTwoVersions(
        context,
        "global",
        "version-1",
        "version-1",
      );

      expect(result).not.toBeNull();
      expect(result?.changes).toHaveLength(0);
    });
  });
});
