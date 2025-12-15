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

/**
 * Archive management for moving large or old versions from lib-state to lib-files.
 *
 * Adobe I/O State has a 1MB limit per value. When versions exceed this or become old,
 * we archive them to lib-files which supports much larger storage.
 *
 * @see https://developer.adobe.com/commerce/extensibility/app-development/best-practices/database-storage/
 */

import AioLogger from "@adobe/aio-lib-core-logging";

import { getSharedFiles, getSharedState } from "#utils/repository";

import { getValueSize } from "./storage-limits";

import type { ConfigVersion } from "#modules/versioning/types";

const logger = AioLogger("aio-commerce-lib-config:archive");

/**
 * Storage size constants
 */
const BYTES_PER_KB = 1024;
const ARCHIVE_SIZE_KB = 900;

/**
 * Archive storage threshold (900KB - approaching 1MB limit).
 */
const ARCHIVE_SIZE_THRESHOLD = ARCHIVE_SIZE_KB * BYTES_PER_KB; // 900KB in bytes

/**
 * Default age threshold for archiving (90 days).
 */
const DEFAULT_ARCHIVE_AGE_DAYS = 90;

/**
 * Regex pattern for safe path components (security: prevent path traversal).
 */
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Time constants for day calculations
 */
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

/**
 * Archive reference stored in lib-state when version is moved to lib-files.
 */
export type ArchiveReference = {
  id: string;
  archived: true;
  archivedAt: string;
  archivePath: string;
  sizeInBytes: number;
  reason: "size" | "age" | "manual";
};

/**
 * Checks if a version should be archived based on size or age.
 *
 * @param version - Version to check.
 * @param maxAgeDays - Maximum age in days before archiving (default: 90).
 * @returns True if version should be archived.
 */
export function shouldArchive(
  version: ConfigVersion,
  maxAgeDays: number = DEFAULT_ARCHIVE_AGE_DAYS,
): { should: boolean; reason: "size" | "age" | null } {
  const sizeInBytes = getValueSize(version);

  // Check size threshold (approaching 1MB limit)
  if (sizeInBytes >= ARCHIVE_SIZE_THRESHOLD) {
    return { should: true, reason: "size" };
  }

  // Check age threshold
  const versionDate = new Date(version.timestamp);
  const ageInDays = getDaysOld(versionDate);

  if (ageInDays > maxAgeDays) {
    return { should: true, reason: "age" };
  }

  return { should: false, reason: null };
}

/**
 * Gets the age of a date in days.
 */
function getDaysOld(date: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / MS_PER_DAY);
}

/**
 * Options for archiving a version.
 */
type ArchiveVersionOptions = {
  namespace: string;
  scopeCode: string;
  version: ConfigVersion;
  reason?: "size" | "age" | "manual";
  precalculatedSize?: number;
};

/**
 * Archives a version to lib-files and replaces lib-state entry with reference.
 *
 * @param options - Archive options.
 * @returns Archive reference.
 */
export async function archiveVersion(
  options: ArchiveVersionOptions,
): Promise<ArchiveReference> {
  const { scopeCode, version, reason = "manual", precalculatedSize } = options;

  const files = await getSharedFiles();
  const state = await getSharedState();

  // Generate archive path (with security validation)
  const archivePath = getArchivePath(scopeCode, version.id);

  // Save to lib-files
  await files.write(archivePath, JSON.stringify(version));

  // Use precalculated size if available to avoid redundant calculation
  const sizeInBytes = precalculatedSize ?? getValueSize(version);

  // Create reference for lib-state
  const reference: ArchiveReference = {
    id: version.id,
    archived: true,
    archivedAt: new Date().toISOString(),
    archivePath,
    sizeInBytes,
    reason,
  };

  // Replace version in lib-state with lightweight reference
  const stateKey = `version:${scopeCode}:${version.id}`;
  await state.put(stateKey, JSON.stringify(reference), { ttl: -1 });

  return reference;
}

/**
 * Restores a version from lib-files archive.
 *
 * @param _namespace - Storage namespace (reserved for future use).
 * @param scopeCode - Scope code.
 * @param versionId - Version ID to restore.
 * @returns Restored version or null if not found.
 */
export async function restoreFromArchive(
  _namespace: string,
  scopeCode: string,
  versionId: string,
): Promise<ConfigVersion | null> {
  const state = await getSharedState();
  const stateKey = `version:${scopeCode}:${versionId}`;

  const stateValue = await state.get(stateKey);
  if (!stateValue?.value) {
    return null;
  }

  const entry = JSON.parse(stateValue.value);

  // If it's an archive reference, fetch from lib-files
  if (isArchiveReference(entry)) {
    const files = await getSharedFiles();
    const archivedData = await files.read(entry.archivePath);

    if (!archivedData) {
      throw new Error(
        `Archive not found at ${entry.archivePath} for version ${versionId}`,
      );
    }

    return JSON.parse(archivedData.toString());
  }

  // It's a regular version in lib-state
  return entry as ConfigVersion;
}

/**
 * Type guard to check if an entry is an archive reference.
 */
function isArchiveReference(entry: unknown): entry is ArchiveReference {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "archived" in entry &&
    entry.archived === true &&
    "archivePath" in entry
  );
}

/**
 * Archives old versions for a scope.
 *
 * Uses parallel processing for better performance when handling multiple versions.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @param versionIds - Array of version IDs to check.
 * @param maxAgeDays - Maximum age in days (default: 90).
 * @returns Number of versions archived.
 */
export async function archiveOldVersions(
  namespace: string,
  scopeCode: string,
  versionIds: string[],
  maxAgeDays: number = DEFAULT_ARCHIVE_AGE_DAYS,
): Promise<number> {
  // Process all versions in parallel for better performance
  const results = await Promise.allSettled(
    versionIds.map(async (versionId) => {
      try {
        const version = await restoreFromArchive(
          namespace,
          scopeCode,
          versionId,
        );

        if (!version) {
          return false;
        }

        // Skip if already archived
        if (isArchiveReference(version)) {
          return false;
        }

        const { should, reason } = shouldArchive(version, maxAgeDays);

        if (should && reason) {
          await archiveVersion({
            namespace,
            scopeCode,
            version,
            reason,
          });
          return true;
        }

        return false;
      } catch (error) {
        // Log but continue with other versions
        logger.warn(
          `Failed to archive version ${versionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    }),
  );

  // Count successful archives
  return results.filter(
    (result) => result.status === "fulfilled" && result.value === true,
  ).length;
}

/**
 * Attempts to save a version, automatically archiving to lib-files if >1MB.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @param version - Version to save.
 * @returns True if saved to lib-state, false if archived to lib-files.
 */
export async function saveVersionWithAutoArchive(
  namespace: string,
  scopeCode: string,
  version: ConfigVersion,
): Promise<{ archived: boolean; reference?: ArchiveReference }> {
  const sizeInBytes = getValueSize(version);

  // If approaching or exceeding 1MB, go directly to lib-files
  if (sizeInBytes >= ARCHIVE_SIZE_THRESHOLD) {
    // Pass precalculated size to avoid redundant calculation
    const reference = await archiveVersion({
      namespace,
      scopeCode,
      version,
      reason: "size",
      precalculatedSize: sizeInBytes,
    });

    return { archived: true, reference };
  }

  // Save normally to lib-state
  const state = await getSharedState();
  const stateKey = `version:${scopeCode}:${version.id}`;
  await state.put(stateKey, JSON.stringify(version), { ttl: -1 });

  return { archived: false };
}

/**
 * Gets the archive path for a version.
 * Validates inputs to prevent path traversal attacks.
 *
 * @param scopeCode - Scope code (must be alphanumeric, dash, or underscore).
 * @param versionId - Version ID (must be alphanumeric, dash, or underscore).
 * @returns Safe archive path.
 * @throws {Error} If inputs contain invalid characters.
 */
function getArchivePath(scopeCode: string, versionId: string): string {
  // Security: Validate inputs to prevent path traversal
  if (!SAFE_PATH_PATTERN.test(scopeCode)) {
    throw new Error(
      `Invalid scopeCode: "${scopeCode}". Only alphanumeric characters, dashes, and underscores are allowed.`,
    );
  }

  if (!SAFE_PATH_PATTERN.test(versionId)) {
    throw new Error(
      `Invalid versionId: "${versionId}". Only alphanumeric characters, dashes, and underscores are allowed.`,
    );
  }

  return `archives/versions/${scopeCode}/${versionId}.json`;
}

/**
 * Gets storage statistics for a scope.
 *
 * @param _namespace - Storage namespace (reserved for future use).
 * @param scopeCode - Scope code.
 * @param versionIds - Array of version IDs.
 * @returns Storage statistics.
 */
export async function getStorageStats(
  _namespace: string,
  scopeCode: string,
  versionIds: string[],
): Promise<{
  totalVersions: number;
  archivedCount: number;
  activeCount: number;
  totalSizeBytes: number;
  averageSizeBytes: number;
  largestSizeBytes: number;
}> {
  let archivedCount = 0;
  let totalSizeBytes = 0;
  let largestSizeBytes = 0;

  const state = await getSharedState();

  for (const versionId of versionIds) {
    try {
      const stateKey = `version:${scopeCode}:${versionId}`;
      const stateValue = await state.get(stateKey);

      if (!stateValue?.value) {
        continue;
      }

      const entry = JSON.parse(stateValue.value);

      if (isArchiveReference(entry)) {
        archivedCount += 1;
        totalSizeBytes += entry.sizeInBytes;
        largestSizeBytes = Math.max(largestSizeBytes, entry.sizeInBytes);
      } else {
        const sizeInBytes = getValueSize(entry);
        totalSizeBytes += sizeInBytes;
        largestSizeBytes = Math.max(largestSizeBytes, sizeInBytes);
      }
    } catch (error) {
      logger.warn(
        `Failed to get stats for version ${versionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const totalVersions = versionIds.length;
  const activeCount = totalVersions - archivedCount;

  return {
    totalVersions,
    archivedCount,
    activeCount,
    totalSizeBytes,
    averageSizeBytes:
      totalVersions > 0 ? Math.floor(totalSizeBytes / totalVersions) : 0,
    largestSizeBytes,
  };
}
