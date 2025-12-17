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
  archiveVersion,
  restoreFromArchive,
  saveVersionWithAutoArchive,
  shouldArchive,
} from "#utils/archive";

import type { ConfigVersion } from "#modules/versioning/types";
import type { ArchiveReference } from "#utils/archive";

vi.mock("#utils/repository", () => ({
  getSharedState: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }),
  ),
  getSharedFiles: vi.fn(() =>
    Promise.resolve({
      read: vi.fn(),
      write: vi.fn(),
      delete: vi.fn(),
    }),
  ),
}));

vi.mock("#utils/storage-limits", () => ({
  getValueSize: vi.fn(() => 500 * 1024), // 500KB by default
  PERSISTENT_TTL: -1,
}));

describe("Archive Management", () => {
  const mockVersion: ConfigVersion = {
    id: "version-1",
    scope: { id: "scope-1", code: "global", level: "global" },
    snapshot: [],
    diff: [],
    timestamp: "2024-01-01T00:00:00Z",
    previousVersionId: null,
    versionNumber: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("shouldArchive", () => {
    it("should recommend archiving for large versions (>900KB)", async () => {
      const { getValueSize } = await import("#utils/storage-limits");
      vi.mocked(getValueSize).mockReturnValue(950 * 1024); // 950KB

      const result = shouldArchive(mockVersion);

      expect(result.should).toBe(true);
      expect(result.reason).toBe("size");
    });

    it("should recommend archiving for old versions (>90 days)", async () => {
      const { getValueSize } = await import("#utils/storage-limits");
      vi.mocked(getValueSize).mockReturnValue(100 * 1024); // 100KB (small)

      const oldVersion = {
        ...mockVersion,
        timestamp: "2020-01-01T00:00:00Z", // Very old
      };

      const result = shouldArchive(oldVersion, 90);

      expect(result.should).toBe(true);
      expect(result.reason).toBe("age");
    });

    it("should not recommend archiving for recent, small versions", async () => {
      const { getValueSize } = await import("#utils/storage-limits");
      vi.mocked(getValueSize).mockReturnValue(500 * 1024); // 500KB

      const recentVersion = {
        ...mockVersion,
        timestamp: new Date().toISOString(),
      };

      const result = shouldArchive(recentVersion);

      expect(result.should).toBe(false);
      expect(result.reason).toBeNull();
    });
  });

  describe("archiveVersion", () => {
    it("should move version to lib-files and create reference", async () => {
      const { getSharedFiles, getSharedState } = await import(
        "#utils/repository"
      );

      const mockFiles = {
        write: vi.fn().mockResolvedValue(undefined),
        read: vi.fn(),
        delete: vi.fn(),
      };

      const mockState = {
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        delete: vi.fn(),
      };

      vi.mocked(getSharedFiles).mockResolvedValue(mockFiles as never);
      vi.mocked(getSharedState).mockResolvedValue(mockState as never);

      const reference = await archiveVersion({
        namespace: "namespace",
        scopeCode: "global",
        version: mockVersion,
        reason: "size",
      });

      expect(reference.id).toBe("version-1");
      expect(reference.archived).toBe(true);
      expect(reference.reason).toBe("size");
      expect(reference.archivePath).toBe(
        "archives/versions/global/version-1.json",
      );

      expect(mockFiles.write).toHaveBeenCalledWith(
        "archives/versions/global/version-1.json",
        JSON.stringify(mockVersion),
      );

      expect(mockState.put).toHaveBeenCalledWith(
        "version:global:version-1",
        expect.stringContaining('"archived":true'),
        { ttl: -1 },
      );
    });
  });

  describe("restoreFromArchive", () => {
    it("should restore version from lib-files if archived", async () => {
      const { getSharedFiles, getSharedState } = await import(
        "#utils/repository"
      );

      const archiveReference: ArchiveReference = {
        id: "version-1",
        archived: true,
        archivedAt: "2024-01-01T00:00:00Z",
        archivePath: "archives/versions/global/version-1.json",
        sizeInBytes: 950 * 1024,
        reason: "size",
      };

      const mockFiles = {
        read: vi
          .fn()
          .mockResolvedValue(Buffer.from(JSON.stringify(mockVersion))),
        write: vi.fn(),
        delete: vi.fn(),
      };

      const mockState = {
        get: vi
          .fn()
          .mockResolvedValue({ value: JSON.stringify(archiveReference) }),
        put: vi.fn(),
        delete: vi.fn(),
      };

      vi.mocked(getSharedFiles).mockResolvedValue(mockFiles as never);
      vi.mocked(getSharedState).mockResolvedValue(mockState as never);

      const restored = await restoreFromArchive(
        "namespace",
        "global",
        "version-1",
      );

      expect(restored).toEqual(mockVersion);
      expect(mockFiles.read).toHaveBeenCalledWith(
        "archives/versions/global/version-1.json",
      );
    });

    it("should return version directly if not archived", async () => {
      const { getSharedState } = await import("#utils/repository");

      const mockState = {
        get: vi.fn().mockResolvedValue({ value: JSON.stringify(mockVersion) }),
        put: vi.fn(),
        delete: vi.fn(),
      };

      vi.mocked(getSharedState).mockResolvedValue(mockState as never);

      const restored = await restoreFromArchive(
        "namespace",
        "global",
        "version-1",
      );

      expect(restored).toEqual(mockVersion);
    });
  });

  describe("saveVersionWithAutoArchive", () => {
    it("should archive large version automatically", async () => {
      const { getValueSize } = await import("#utils/storage-limits");
      const { getSharedFiles, getSharedState } = await import(
        "#utils/repository"
      );

      vi.mocked(getValueSize).mockReturnValue(950 * 1024); // 950KB

      const mockFiles = {
        write: vi.fn().mockResolvedValue(undefined),
        read: vi.fn(),
        delete: vi.fn(),
      };

      const mockState = {
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        delete: vi.fn(),
      };

      vi.mocked(getSharedFiles).mockResolvedValue(mockFiles as never);
      vi.mocked(getSharedState).mockResolvedValue(mockState as never);

      const result = await saveVersionWithAutoArchive(
        "namespace",
        "global",
        mockVersion,
      );

      expect(result.archived).toBe(true);
      expect(result.reference).toBeDefined();
      expect(result.reference?.reason).toBe("size");
    });

    it("should save small version to lib-state normally", async () => {
      const { getValueSize } = await import("#utils/storage-limits");
      const { getSharedState } = await import("#utils/repository");

      vi.mocked(getValueSize).mockReturnValue(500 * 1024); // 500KB

      const mockState = {
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        delete: vi.fn(),
      };

      vi.mocked(getSharedState).mockResolvedValue(mockState as never);

      const result = await saveVersionWithAutoArchive(
        "namespace",
        "global",
        mockVersion,
      );

      expect(result.archived).toBe(false);
      expect(mockState.put).toHaveBeenCalledWith(
        "version:global:version-1",
        JSON.stringify(mockVersion),
        { ttl: -1 },
      );
    });
  });
});
