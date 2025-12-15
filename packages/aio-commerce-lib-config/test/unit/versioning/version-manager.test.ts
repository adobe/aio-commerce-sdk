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
  createVersion,
  getVersionHistory,
} from "#modules/versioning/version-manager";

import type { ConfigValue } from "#modules/configuration/types";
import type { VersionContext } from "#modules/versioning/types";

// Mock the version repository
vi.mock("#modules/versioning/version-repository", () => ({
  saveVersion: vi.fn(),
  getVersion: vi.fn(),
  saveMetadata: vi.fn(),
  getMetadata: vi.fn(),
  addToVersionList: vi.fn(),
  deleteVersion: vi.fn(),
  getVersionList: vi.fn(),
  getVersions: vi.fn(),
}));

// Mock UUID generator
vi.mock("#utils/uuid", () => ({
  generateUUID: vi.fn(() => "test-uuid-123"),
}));

describe("Version Manager", () => {
  const context: VersionContext = {
    namespace: "test-namespace",
    maxVersions: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createVersion", () => {
    it("should create a version with diff calculation", async () => {
      const { saveVersion, saveMetadata, getMetadata, addToVersionList } =
        await import("#modules/versioning/version-repository");

      vi.mocked(getMetadata).mockResolvedValue(null);
      vi.mocked(addToVersionList).mockResolvedValue(null);

      const oldConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "old-value",
          origin: { code: "global", level: "global" },
        },
      ];

      const newConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "new-value",
          origin: { code: "global", level: "global" },
        },
      ];

      const result = await createVersion(context, {
        scope: { id: "scope-1", code: "global", level: "global" },
        newConfig,
        oldConfig,
        actor: { userId: "user@test.com" },
      });

      expect(result.version.id).toBe("test-uuid-123");
      expect(result.version.versionNumber).toBe(1);
      expect(result.version.diff).toHaveLength(1);
      expect(result.version.diff[0].type).toBe("modified");
      expect(result.metadata.latestVersionId).toBe("test-uuid-123");
      expect(result.metadata.totalVersions).toBe(1);

      expect(saveVersion).toHaveBeenCalledWith(
        context.namespace,
        expect.objectContaining({
          id: "test-uuid-123",
          versionNumber: 1,
        }),
      );

      expect(saveMetadata).toHaveBeenCalled();
      expect(addToVersionList).toHaveBeenCalled();
    });

    it("should increment version number for existing scope", async () => {
      const { getMetadata, addToVersionList } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getMetadata).mockResolvedValue({
        latestVersionId: "previous-version",
        totalVersions: 5,
        lastUpdated: new Date().toISOString(),
      });
      vi.mocked(addToVersionList).mockResolvedValue(null);

      const result = await createVersion(context, {
        scope: { id: "scope-1", code: "global", level: "global" },
        newConfig: [],
        oldConfig: [],
      });

      expect(result.version.versionNumber).toBe(6);
      expect(result.version.previousVersionId).toBe("previous-version");
    });

    it("should redact sensitive fields in snapshot and diff", async () => {
      const { getMetadata, addToVersionList } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getMetadata).mockResolvedValue(null);
      vi.mocked(addToVersionList).mockResolvedValue(null);

      const oldConfig: ConfigValue[] = [];

      const newConfig: ConfigValue[] = [
        {
          name: "api_key",
          value: "secret-key-123",
          origin: { code: "global", level: "global" },
        },
        {
          name: "site_name",
          value: "My Store",
          origin: { code: "global", level: "global" },
        },
      ];

      const result = await createVersion(context, {
        scope: { id: "scope-1", code: "global", level: "global" },
        newConfig,
        oldConfig,
      });

      const apiKeySnapshot = result.version.snapshot.find(
        (s) => s.name === "api_key",
      );
      const apiKeyDiff = result.version.diff.find((d) => d.name === "api_key");

      expect(apiKeySnapshot?.value).toBe("***REDACTED***");
      expect(apiKeyDiff?.newValue).toBe("***REDACTED***");

      const siteNameSnapshot = result.version.snapshot.find(
        (s) => s.name === "site_name",
      );
      expect(siteNameSnapshot?.value).toBe("My Store");
    });

    it("should delete old version when max versions exceeded", async () => {
      const { getMetadata, addToVersionList, deleteVersion } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getMetadata).mockResolvedValue({
        latestVersionId: "previous-version",
        totalVersions: 25,
        lastUpdated: new Date().toISOString(),
      });
      vi.mocked(addToVersionList).mockResolvedValue("oldest-version-id");

      await createVersion(context, {
        scope: { id: "scope-1", code: "global", level: "global" },
        newConfig: [],
        oldConfig: [],
      });

      expect(deleteVersion).toHaveBeenCalledWith(
        context.namespace,
        "global",
        "oldest-version-id",
      );
    });

    it("should handle actor information", async () => {
      const { getMetadata, addToVersionList } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getMetadata).mockResolvedValue(null);
      vi.mocked(addToVersionList).mockResolvedValue(null);

      const result = await createVersion(context, {
        scope: { id: "scope-1", code: "global", level: "global" },
        newConfig: [],
        oldConfig: [],
        actor: {
          userId: "admin@test.com",
          source: "admin-panel",
        },
      });

      expect(result.version.actor).toEqual({
        userId: "admin@test.com",
        source: "admin-panel",
      });
    });
  });

  describe("getVersionHistory", () => {
    it("should retrieve version history with pagination", async () => {
      const { getVersionList, getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getVersionList).mockResolvedValue([
        "version-1",
        "version-2",
        "version-3",
      ]);

      const mockVersions = {
        "version-3": {
          id: "version-3",
          scope: { id: "scope-1", code: "global", level: "global" },
          snapshot: [],
          diff: [],
          timestamp: "2025-01-03T00:00:00Z",
          previousVersionId: "version-2",
          versionNumber: 3,
        },
        "version-2": {
          id: "version-2",
          scope: { id: "scope-1", code: "global", level: "global" },
          snapshot: [],
          diff: [],
          timestamp: "2025-01-02T00:00:00Z",
          previousVersionId: "version-1",
          versionNumber: 2,
        },
        "version-1": {
          id: "version-1",
          scope: { id: "scope-1", code: "global", level: "global" },
          snapshot: [],
          diff: [],
          timestamp: "2025-01-01T00:00:00Z",
          previousVersionId: null,
          versionNumber: 1,
        },
      };

      vi.mocked(getVersion).mockImplementation(
        async (_ns, _scope, id) =>
          mockVersions[id as keyof typeof mockVersions] || null,
      );

      const result = await getVersionHistory(context, {
        scopeCode: "global",
        limit: 2,
        offset: 0,
      });

      expect(result.versions).toHaveLength(2);
      expect(result.versions[0].id).toBe("version-3");
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should use default pagination values", async () => {
      const { getVersionList, getVersion } = await import(
        "#modules/versioning/version-repository"
      );

      vi.mocked(getVersionList).mockResolvedValue(["version-1"]);
      vi.mocked(getVersion).mockResolvedValue({
        id: "version-1",
        scope: { id: "scope-1", code: "global", level: "global" },
        snapshot: [],
        diff: [],
        timestamp: "2025-01-01T00:00:00Z",
        previousVersionId: null,
        versionNumber: 1,
      });

      const result = await getVersionHistory(context, {
        scopeCode: "global",
      });

      expect(result.pagination.limit).toBe(25);
      expect(result.pagination.offset).toBe(0);
    });
  });
});
