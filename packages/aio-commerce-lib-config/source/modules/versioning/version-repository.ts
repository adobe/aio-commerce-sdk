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

import { restoreFromArchive, saveVersionWithAutoArchive } from "#utils/archive";
import { getSharedState } from "#utils/repository";
import {
  getValueSize,
  PERSISTENT_TTL,
  StorageLimitExceededError,
} from "#utils/storage-limits";

import type { ConfigVersion, VersionMetadata } from "./types";

const VERSION_KEY_PREFIX = "version";
const METADATA_KEY_PREFIX = "version-meta";
const VERSION_LIST_KEY_PREFIX = "version-list";

/**
 * Storage size constants
 */
const BYTES_PER_KB = 1024;
const KB_PER_MB = 1024;
const MAX_PRACTICAL_SIZE_MB = 10;
const MAX_PRACTICAL_SIZE = MAX_PRACTICAL_SIZE_MB * KB_PER_MB * BYTES_PER_KB; // 10MB reasonable limit

/**
 * Generates a storage key for a version.
 */
function getVersionKey(scopeCode: string, versionId: string): string {
  return `${VERSION_KEY_PREFIX}:${scopeCode}:${versionId}`;
}

/**
 * Generates a storage key for version metadata.
 */
function getMetadataKey(scopeCode: string): string {
  return `${METADATA_KEY_PREFIX}:${scopeCode}`;
}

/**
 * Generates a storage key for the version list.
 */
function getVersionListKey(scopeCode: string): string {
  return `${VERSION_LIST_KEY_PREFIX}:${scopeCode}`;
}

/**
 * Saves a version to storage with automatic archiving for large versions.
 *
 * Versions >900KB are automatically saved to lib-files instead of lib-state.
 * This prevents hitting the 1MB Adobe I/O State limit.
 *
 * @param namespace - Storage namespace (reserved for future multi-tenancy).
 * @param version - Version to save.
 * @returns Save result indicating if version was archived.
 * @throws {StorageLimitExceededError} If version exceeds 1MB even for lib-files.
 * @see https://developer.adobe.com/commerce/extensibility/app-development/best-practices/database-storage/
 */
export async function saveVersion(
  namespace: string,
  version: ConfigVersion,
): Promise<{ archived: boolean }> {
  const sizeInBytes = getValueSize(version);

  // Sanity check: Even lib-files has practical limits
  if (sizeInBytes > MAX_PRACTICAL_SIZE) {
    throw new StorageLimitExceededError(sizeInBytes, MAX_PRACTICAL_SIZE);
  }

  // Use auto-archive which decides lib-state vs lib-files based on size
  const result = await saveVersionWithAutoArchive(
    namespace,
    version.scope.code,
    version,
  );

  return { archived: result.archived };
}

/**
 * Gets a version from storage (checks both lib-state and lib-files archive).
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @param versionId - Version ID.
 * @returns Version or null if not found.
 */
export function getVersion(
  namespace: string,
  scopeCode: string,
  versionId: string,
): Promise<ConfigVersion | null> {
  // This handles both regular versions and archived versions
  return restoreFromArchive(namespace, scopeCode, versionId);
}

/**
 * Saves version metadata.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @param metadata - Metadata to save.
 */
export async function saveMetadata(
  _namespace: string,
  scopeCode: string,
  metadata: VersionMetadata,
): Promise<void> {
  const state = await getSharedState();
  const key = getMetadataKey(scopeCode);
  await state.put(key, JSON.stringify(metadata), { ttl: PERSISTENT_TTL });
}

/**
 * Gets version metadata for a scope.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @returns Version metadata or null if not found.
 */
export async function getMetadata(
  _namespace: string,
  scopeCode: string,
): Promise<VersionMetadata | null> {
  const state = await getSharedState();
  const key = getMetadataKey(scopeCode);

  try {
    const result = await state.get(key);
    if (result?.value) {
      return JSON.parse(result.value) as VersionMetadata;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Adds a version ID to the version list for a scope.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @param versionId - Version ID to add.
 * @param maxVersions - Maximum number of versions to keep.
 * @returns ID of version that was removed (if any).
 */
export async function addToVersionList(
  _namespace: string,
  scopeCode: string,
  versionId: string,
  maxVersions: number,
): Promise<string | null> {
  const state = await getSharedState();
  const key = getVersionListKey(scopeCode);

  let versionList: string[] = [];
  try {
    const result = await state.get(key);
    if (result?.value) {
      versionList = JSON.parse(result.value) as string[];
    }
  } catch {
    // List doesn't exist yet
  }

  // Add new version to the end
  versionList.push(versionId);

  // Remove oldest version if limit exceeded
  let removedVersionId: string | null = null;
  if (versionList.length > maxVersions) {
    removedVersionId = versionList.shift() ?? null;
  }

  await state.put(key, JSON.stringify(versionList), { ttl: PERSISTENT_TTL });

  return removedVersionId;
}

/**
 * Gets the list of version IDs for a scope.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @returns Array of version IDs (newest last).
 */
export async function getVersionList(
  _namespace: string,
  scopeCode: string,
): Promise<string[]> {
  const state = await getSharedState();
  const key = getVersionListKey(scopeCode);

  try {
    const result = await state.get(key);
    if (result?.value) {
      return JSON.parse(result.value) as string[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Deletes a version from storage.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @param versionId - Version ID to delete.
 */
export async function deleteVersion(
  _namespace: string,
  scopeCode: string,
  versionId: string,
): Promise<void> {
  const state = await getSharedState();
  const key = getVersionKey(scopeCode, versionId);
  await state.delete(key);
}

/**
 * Gets multiple versions by their IDs.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @param versionIds - Array of version IDs.
 * @returns Array of versions (null for not found).
 */
export function getVersions(
  namespace: string,
  scopeCode: string,
  versionIds: string[],
): Promise<(ConfigVersion | null)[]> {
  return Promise.all(
    versionIds.map((id) => getVersion(namespace, scopeCode, id)),
  );
}
