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

import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPasswordFields } from "#modules/schema/utils";
import {
  redactSensitiveConfig,
  redactSensitiveDiffs,
} from "#modules/versioning/secret-redaction";
import {
  archiveStoredVersion,
  getVersion,
  getVersionRecord,
} from "#modules/versioning/version-repository";

import { ARCHIVE_SIZE_THRESHOLD } from "./history-storage";
import { getValueSize } from "./storage-limits";

import type { ConfigVersion } from "#modules/versioning/types";

/** Lightweight primary record for a snapshot stored in the archive collection. */
export type ArchiveReference = {
  /** Archived version ID. */
  id: string;
  /** Marks this record as an archive reference. */
  archived: true;
  /** ISO timestamp at which the snapshot was archived. */
  archivedAt: string;
  /** Derived, namespace-isolated archive path. */
  archivePath: string;
  /** UTF-8 bytes in the archived JSON payload. */
  sizeInBytes: number;
  /** Why the version was archived. */
  reason: "size" | "age" | "manual";
};

/** Returns whether a version is at least 900 KiB or older than the given age (default 90 days). */
export function shouldArchive(
  version: ConfigVersion,
  maxAgeDays = 90,
): { should: boolean; reason: "size" | "age" | null } {
  if (
    !Number.isFinite(maxAgeDays) ||
    maxAgeDays < 0 ||
    !Number.isFinite(Date.parse(version.timestamp))
  ) {
    throw new Error(
      "INVALID_ARCHIVE_AGE: timestamp must be valid and age must be non-negative",
    );
  }
  if (getValueSize(version) >= ARCHIVE_SIZE_THRESHOLD) {
    return { reason: "size", should: true };
  }
  return Date.now() - Date.parse(version.timestamp) > maxAgeDays * 86_400_000
    ? { reason: "age", should: true }
    : { reason: null, should: false };
}

/**
 * Archives a redacted snapshot in Files and replaces its primary record with a reference.
 * Requires an initialized schema so password fields can be redacted.
 *
 * @param options - Namespace, scope, snapshot, and optional reason for archiving.
 */
export async function archiveVersion(options: {
  namespace: string;
  scopeCode: string;
  version: ConfigVersion;
  reason?: ArchiveReference["reason"];
}) {
  const passwordFields = getPasswordFields(requireGlobalSchema());
  const version = {
    ...options.version,
    diff: redactSensitiveDiffs(options.version.diff, passwordFields),
    snapshot: redactSensitiveConfig(options.version.snapshot, passwordFields),
  };
  return await archiveStoredVersion(
    options.namespace,
    options.scopeCode,
    version,
    options.reason ?? "manual",
  );
}

/** Reads an active or archived snapshot without changing live configuration; returns null when absent. */
export async function restoreFromArchive(
  namespace: string,
  scopeCode: string,
  versionId: string,
) {
  return await getVersion(namespace, scopeCode, versionId);
}

/** Archives eligible, non-archived versions and returns their count. Storage failures reject the operation. */
export async function archiveOldVersions(
  namespace: string,
  scopeCode: string,
  versionIds: string[],
  maxAgeDays = 90,
) {
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0) {
    throw new Error("INVALID_ARCHIVE_AGE: age must be non-negative");
  }
  const results = await Promise.all(
    [...new Set(versionIds)].map(async (id) => {
      const record = await getVersionRecord(namespace, scopeCode, id);
      if (!record || "archived" in record) {
        return false;
      }
      const { should, reason } = shouldArchive(record, maxAgeDays);
      if (should && reason) {
        await archiveVersion({ namespace, reason, scopeCode, version: record });
        return true;
      }
      return false;
    }),
  );
  return results.filter(Boolean).length;
}

/** Gets logical payload sizes for existing versions, excluding duplicate IDs and reference overhead. */
export async function getStorageStats(
  namespace: string,
  scopeCode: string,
  versionIds: string[],
) {
  const records = await Promise.all(
    [...new Set(versionIds)].map(async (id) => {
      const record = await getVersionRecord(namespace, scopeCode, id);
      const version = await getVersion(namespace, scopeCode, id);
      return record && version
        ? { archived: "archived" in record, size: getValueSize(version) }
        : null;
    }),
  );
  const existing = records.filter((record) => record !== null);
  const archivedCount = existing.filter((record) => record.archived).length;
  const totalSizeBytes = existing.reduce((sum, record) => sum + record.size, 0);
  return {
    activeCount: existing.length - archivedCount,
    archivedCount,
    averageSizeBytes:
      existing.length === 0 ? 0 : Math.floor(totalSizeBytes / existing.length),
    largestSizeBytes: existing.reduce(
      (largest, record) => Math.max(largest, record.size),
      0,
    ),
    totalSizeBytes,
    totalVersions: existing.length,
  };
}
