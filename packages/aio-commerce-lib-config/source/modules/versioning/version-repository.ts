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

import * as v from "valibot";

import {
  ARCHIVE_SIZE_THRESHOLD,
  ArchiveReferenceSchema,
  historyPath,
  historyPrefix,
  listHistoryPaths,
  readHistoryFile,
  serializeHistory,
  VersionRecordSchema,
  VersionSchema,
} from "#utils/history-storage";
import { getSharedFiles } from "#utils/repository";
import { getValueSize } from "#utils/storage-limits";

import type { ArchiveReference } from "#utils/archive";
import type { ConfigVersion } from "./types";

/** Reads a version or its archive reference, validating record identity. */
export async function getVersionRecord(
  namespace: string,
  scopeCode: string,
  id: string,
) {
  const path = historyPath(namespace, "versions", scopeCode, id);
  const record = await readHistoryFile(path, VersionRecordSchema);
  if (
    record &&
    (record.id !== id ||
      (!("archived" in record) &&
        record.scope.code.toLowerCase() !== scopeCode.toLowerCase()))
  ) {
    throw new Error("CORRUPT_HISTORY: version identity mismatch");
  }
  return record;
}

/** Reads a retained version, transparently resolving an archive reference. */
export async function getVersion(
  namespace: string,
  scopeCode: string,
  id: string,
): Promise<ConfigVersion | null> {
  const record = await getVersionRecord(namespace, scopeCode, id);
  if (!(record && "archived" in record)) {
    return record;
  }
  const expectedPath = historyPath(namespace, "archives", scopeCode, id);
  if (record.archivePath !== expectedPath) {
    throw new Error("CORRUPT_HISTORY: archive path mismatch");
  }
  const version = await readHistoryFile(expectedPath, VersionSchema);
  if (
    !version ||
    version.id !== id ||
    version.scope.code.toLowerCase() !== scopeCode.toLowerCase()
  ) {
    throw new Error(
      "CORRUPT_HISTORY: archived version is missing or has a different identity",
    );
  }
  return version;
}

/** Lists snapshots newest first without a mutable shared index. */
export async function listVersions(namespace: string, scopeCode: string) {
  const paths = await listHistoryPaths(
    historyPrefix(namespace, "versions", scopeCode),
  );
  const versions = await Promise.all(
    paths.map(async (path) => {
      const record = await readHistoryFile(path, VersionRecordSchema);
      if (
        !record ||
        path !== historyPath(namespace, "versions", scopeCode, record.id)
      ) {
        throw new Error(
          "CORRUPT_HISTORY: listed version is missing or has a different identity",
        );
      }
      const version = await getVersion(namespace, scopeCode, record.id);
      if (!version) {
        throw new Error("CORRUPT_HISTORY: listed version is missing");
      }
      return version;
    }),
  );
  return versions.sort(
    (a, b) => b.versionNumber - a.versionNumber || b.id.localeCompare(a.id),
  );
}

/** Persists a snapshot in Files, moving large payloads to the archive collection. */
export async function saveVersion(
  namespace: string,
  scopeCode: string,
  version: ConfigVersion,
) {
  const serialized = serializeHistory(v.parse(VersionSchema, version));
  if (getValueSize(version) >= ARCHIVE_SIZE_THRESHOLD) {
    await archiveStoredVersion(namespace, scopeCode, version, "size");
    return;
  }
  const files = await getSharedFiles();
  await files.write(
    historyPath(namespace, "versions", scopeCode, version.id),
    serialized,
  );
}

/** Moves a snapshot into the archive collection and retains a validated reference. */
export async function archiveStoredVersion(
  namespace: string,
  scopeCode: string,
  version: ConfigVersion,
  reason: ArchiveReference["reason"],
): Promise<ArchiveReference> {
  const validated = v.parse(VersionSchema, version);
  if (validated.scope.code.toLowerCase() !== scopeCode.toLowerCase()) {
    throw new Error("INVALID_ARCHIVE: version belongs to a different scope");
  }
  const serialized = serializeHistory(validated);
  const archivePath = historyPath(
    namespace,
    "archives",
    scopeCode,
    validated.id,
  );
  const reference = v.parse(ArchiveReferenceSchema, {
    archived: true,
    archivedAt: new Date().toISOString(),
    archivePath,
    id: validated.id,
    reason,
    sizeInBytes: Buffer.byteLength(serialized, "utf8"),
  });
  const files = await getSharedFiles();
  await files.write(archivePath, serialized);
  await files.write(
    historyPath(namespace, "versions", scopeCode, validated.id),
    JSON.stringify(reference),
  );
  return reference;
}

/** Deletes both the primary record and any archived payload during retention. */
export async function deleteVersion(
  namespace: string,
  scopeCode: string,
  id: string,
) {
  const files = await getSharedFiles();
  await files.delete(historyPath(namespace, "versions", scopeCode, id));
  await files.delete(historyPath(namespace, "archives", scopeCode, id));
}
