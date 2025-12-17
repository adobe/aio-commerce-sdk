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

import { fetchPaginatedEntities } from "#utils/pagination";
import { generateUUID } from "#utils/uuid";
import { DEFAULT_VERSION_HISTORY_LIMIT } from "#utils/versioning-constants";

import { calculateDiff } from "./diff-calculator";
import {
  redactSensitiveConfig,
  redactSensitiveDiffs,
} from "./secret-redaction";
import * as versionRepository from "./version-repository";

import type {
  ConfigVersion,
  CreateVersionRequest,
  CreateVersionResponse,
  GetVersionHistoryRequest,
  GetVersionHistoryResponse,
  VersionContext,
} from "./types";

/**
 * Creates a new version from a configuration change.
 *
 * @param context - Version context.
 * @param request - Version creation request.
 * @returns Created version and metadata.
 */
export async function createVersion(
  context: VersionContext,
  request: CreateVersionRequest,
): Promise<CreateVersionResponse> {
  const { scope, newConfig, oldConfig, actor } = request;

  const gdprCompliantDiff = calculateGdprCompliantDiff(oldConfig, newConfig);
  const versionMetadata = await determineVersionMetadata(context, scope.code);
  const version = buildVersionRecord({
    scope,
    newConfig,
    diff: gdprCompliantDiff,
    versionMetadata,
    actor,
  });

  await persistVersion(context, version);
  await cleanupOldVersionsIfNeeded(context, scope.code, version.id);

  const updatedMetadata = buildUpdatedMetadata(version, context.maxVersions);
  await versionRepository.saveMetadata(
    context.namespace,
    scope.code,
    updatedMetadata,
  );

  return {
    version,
    metadata: updatedMetadata,
  };
}

/**
 * Calculates diff with GDPR-compliant redaction of sensitive fields.
 */
function calculateGdprCompliantDiff(
  oldConfig: CreateVersionRequest["oldConfig"],
  newConfig: CreateVersionRequest["newConfig"],
) {
  const rawDiff = calculateDiff(oldConfig, newConfig);
  return redactSensitiveDiffs(rawDiff);
}

/**
 * Determines version number and previous version reference.
 */
async function determineVersionMetadata(
  context: VersionContext,
  scopeCode: string,
) {
  const currentMetadata = await versionRepository.getMetadata(
    context.namespace,
    scopeCode,
  );

  return {
    versionNumber: (currentMetadata?.totalVersions ?? 0) + 1,
    previousVersionId: currentMetadata?.latestVersionId ?? null,
  };
}

/**
 * Options for building a version record.
 */
type BuildVersionRecordOptions = {
  scope: CreateVersionRequest["scope"];
  newConfig: CreateVersionRequest["newConfig"];
  diff: ReturnType<typeof redactSensitiveDiffs>;
  versionMetadata: { versionNumber: number; previousVersionId: string | null };
  actor?: CreateVersionRequest["actor"];
};

/**
 * Builds a complete version record with all required fields.
 */
function buildVersionRecord(options: BuildVersionRecordOptions): ConfigVersion {
  return {
    id: generateUUID(),
    scope: options.scope,
    snapshot: redactSensitiveConfig(options.newConfig),
    diff: options.diff,
    timestamp: new Date().toISOString(),
    previousVersionId: options.versionMetadata.previousVersionId,
    versionNumber: options.versionMetadata.versionNumber,
    actor: options.actor,
  };
}

/**
 * Persists version to storage.
 */
async function persistVersion(context: VersionContext, version: ConfigVersion) {
  await versionRepository.saveVersion(context.namespace, version);
}

/**
 * Cleans up old versions when retention limit is exceeded.
 */
async function cleanupOldVersionsIfNeeded(
  context: VersionContext,
  scopeCode: string,
  newVersionId: string,
) {
  const removedVersionId = await versionRepository.addToVersionList(
    context.namespace,
    scopeCode,
    newVersionId,
    context.maxVersions,
  );

  if (removedVersionId) {
    await versionRepository.deleteVersion(
      context.namespace,
      scopeCode,
      removedVersionId,
    );
  }
}

/**
 * Builds updated version metadata record.
 */
function buildUpdatedMetadata(version: ConfigVersion, maxVersions: number) {
  return {
    latestVersionId: version.id,
    totalVersions: Math.min(version.versionNumber, maxVersions),
    lastUpdated: version.timestamp,
  };
}

/**
 * Gets version history for a scope using Adobe recommended index-based pagination.
 *
 * Implements the pattern from Adobe's best practices:
 * 1. Maintain an index of version IDs (done in version-repository)
 * 2. Paginate the index to get subset of IDs
 * 3. Fetch individual versions in parallel
 *
 * @param context - Version context.
 * @param request - History request with filters.
 * @returns Version history with pagination.
 * @see https://developer.adobe.com/commerce/extensibility/app-development/best-practices/database-storage/
 */
export async function getVersionHistory(
  context: VersionContext,
  request: GetVersionHistoryRequest,
): Promise<GetVersionHistoryResponse> {
  const {
    scopeCode,
    limit = DEFAULT_VERSION_HISTORY_LIMIT,
    offset = 0,
  } = request;

  const versionIdIndex = await versionRepository.getVersionList(
    context.namespace,
    scopeCode,
  );

  const newestFirstIds = versionIdIndex.reverse();

  const fetchVersionById = (id: string) =>
    versionRepository.getVersion(context.namespace, scopeCode, id);

  const paginatedResult = await fetchPaginatedEntities(
    newestFirstIds,
    fetchVersionById,
    limit,
    offset,
  );

  return {
    versions: paginatedResult.items,
    pagination: paginatedResult.pagination,
  };
}

/**
 * Gets a specific version by ID.
 *
 * @param context - Version context.
 * @param scopeCode - Scope code.
 * @param versionId - Version ID.
 * @returns Version or null if not found.
 */
export function getVersionById(
  context: VersionContext,
  scopeCode: string,
  versionId: string,
): Promise<ConfigVersion | null> {
  return versionRepository.getVersion(context.namespace, scopeCode, versionId);
}

/**
 * Gets the latest version for a scope.
 *
 * @param context - Version context.
 * @param scopeCode - Scope code.
 * @returns Latest version or null if no versions exist.
 */
export async function getLatestVersion(
  context: VersionContext,
  scopeCode: string,
): Promise<ConfigVersion | null> {
  const metadata = await versionRepository.getMetadata(
    context.namespace,
    scopeCode,
  );

  if (!metadata?.latestVersionId) {
    return null;
  }

  return versionRepository.getVersion(
    context.namespace,
    scopeCode,
    metadata.latestVersionId,
  );
}
