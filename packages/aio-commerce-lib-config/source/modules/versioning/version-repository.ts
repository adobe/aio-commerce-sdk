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

import { v7 as uuidv7 } from "uuid";

import { getSharedFiles } from "#utils/repository";

import type { ConfigurationVersion } from "#types/api";

const VERSION_FILE_EXTENSION_REGEX = /\.json$/u;

export type CreateVersionRecordOptions = {
  reason: "set" | "restore";
  restoredFromVersionId?: string;
  expectedLatestVersionId?: string;
};

export type VersionRecord = ConfigurationVersion & {
  snapshot: unknown;
};

export type VersionPage = {
  versions: ConfigurationVersion[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * Creates and persists an immutable version record for the given scope.
 */
export async function createVersionRecord(
  scopeCode: string,
  payload: unknown,
  options: CreateVersionRecordOptions,
): Promise<VersionRecord> {
  const files = await getSharedFiles();
  const latest = await getLatestVersionRecord(scopeCode);

  if (
    options.expectedLatestVersionId !== undefined &&
    latest?.id !== options.expectedLatestVersionId
  ) {
    throw new Error("VERSION_CONFLICT: latest version does not match expected");
  }

  const change = computeVersionChange(latest?.snapshot, payload);
  const normalizedScope = normalizeScope(payload, scopeCode);

  const record: VersionRecord = {
    id: uuidv7(),
    timestamp: new Date().toISOString(),
    scope: normalizedScope,
    reason: options.reason,
    restoredFromVersionId: options.restoredFromVersionId,
    change,
    snapshot: payload,
  };

  await files.write(
    getVersionSnapshotPath(scopeCode, record.id),
    JSON.stringify(record),
  );
  // Best-effort optimization only. Snapshot files are the source of truth.
  await tryUpdateVersionIndex(scopeCode, record);

  return record;
}

/**
 * Lists version metadata for a scope with offset/limit paging.
 */
export async function listVersionRecords(
  scopeCode: string,
  params: { limit?: number; offset?: number } = {},
): Promise<VersionPage> {
  const allVersionIds = await listVersionIds(scopeCode);
  const limit = sanitizeLimit(params.limit);
  const offset = sanitizeOffset(params.offset);
  const selectedIds = allVersionIds.slice(offset, offset + limit);
  const versionCandidates = await Promise.all(
    selectedIds.map(async (versionId) =>
      readVersionSnapshot(scopeCode, versionId),
    ),
  );
  const versions = versionCandidates
    .filter((version): version is VersionRecord => version !== null)
    .map(toVersionMetadata);

  return {
    versions,
    total: allVersionIds.length,
    limit,
    offset,
  };
}

/**
 * Gets a specific version record (including snapshot) by id.
 */
export async function getVersionRecord(
  scopeCode: string,
  versionId: string,
): Promise<VersionRecord | null> {
  return await readVersionSnapshot(scopeCode, versionId);
}

async function readVersionSnapshot(
  scopeCode: string,
  versionId: string,
): Promise<VersionRecord | null> {
  try {
    const files = await getSharedFiles();
    const path = getVersionSnapshotPath(scopeCode, versionId);
    const content = await files.read(path);
    if (!content) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content.toString("utf8"));
    } catch {
      throw new Error(
        `CORRUPT_VERSION_RECORD: invalid JSON for scope='${scopeCode}' version='${versionId}'`,
      );
    }

    if (!isVersionRecord(parsed)) {
      throw new Error(
        `CORRUPT_VERSION_RECORD: invalid shape for scope='${scopeCode}' version='${versionId}'`,
      );
    }

    return parsed;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function readVersionIndex(
  scopeCode: string,
): Promise<ConfigurationVersion[]> {
  try {
    const files = await getSharedFiles();
    const indexPath = getVersionIndexPath(scopeCode);
    const versionDir = getVersionDirectoryPath(scopeCode);
    const filesList = await files.list(versionDir);
    const indexExists = filesList.some((file) => file.name === indexPath);
    if (!indexExists) {
      return [];
    }

    const content = await files.read(indexPath);
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content.toString("utf8"));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isVersionMetadata);
  } catch (_) {
    return [];
  }
}

async function getLatestVersionRecord(
  scopeCode: string,
): Promise<VersionRecord | null> {
  const [latestVersionId] = await listVersionIds(scopeCode);
  if (!latestVersionId) {
    return null;
  }
  return await readVersionSnapshot(scopeCode, latestVersionId);
}

async function listVersionIds(scopeCode: string): Promise<string[]> {
  try {
    const files = await getSharedFiles();
    const versionDir = getVersionDirectoryPath(scopeCode);
    const filesList = await files.list(versionDir);
    return filesList
      .map((file) => file.name)
      .filter((path) => isVersionSnapshotPath(path, scopeCode))
      .map((path) => getVersionIdFromPath(path))
      .sort((left, right) => right.localeCompare(left));
  } catch (_) {
    return [];
  }
}

async function tryUpdateVersionIndex(
  scopeCode: string,
  record: VersionRecord,
): Promise<void> {
  try {
    const files = await getSharedFiles();
    const index = await readVersionIndex(scopeCode);
    const nextIndex = [toVersionMetadata(record), ...index].filter(
      (version, indexPosition, allVersions) =>
        allVersions.findIndex((entry) => entry.id === version.id) ===
        indexPosition,
    );
    await files.write(
      getVersionIndexPath(scopeCode),
      JSON.stringify(nextIndex),
    );
  } catch (_) {
    // Ignore index write failures, listing uses snapshots directly.
  }
}

function isVersionMetadata(value: unknown): value is ConfigurationVersion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ConfigurationVersion>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.reason === "string" &&
    !!candidate.scope &&
    Array.isArray(candidate.change?.added) &&
    Array.isArray(candidate.change?.updated) &&
    Array.isArray(candidate.change?.removed)
  );
}

function isVersionRecord(value: unknown): value is VersionRecord {
  return (
    isVersionMetadata(value) &&
    typeof value === "object" &&
    value !== null &&
    "snapshot" in value
  );
}

function normalizeScope(
  payload: unknown,
  scopeCode: string,
): { id: string; code: string; level: string } {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "scope" in payload &&
    typeof payload.scope === "object" &&
    payload.scope !== null &&
    "code" in payload.scope &&
    "level" in payload.scope &&
    "id" in payload.scope
  ) {
    const scope = payload.scope as {
      id: unknown;
      code: unknown;
      level: unknown;
    };
    if (
      typeof scope.id === "string" &&
      typeof scope.code === "string" &&
      typeof scope.level === "string"
    ) {
      return { id: scope.id, code: scope.code, level: scope.level };
    }
  }

  return { id: scopeCode, code: scopeCode, level: "unknown" };
}

function toVersionMetadata(record: VersionRecord): ConfigurationVersion {
  const { snapshot: _snapshot, ...metadata } = record;
  return metadata;
}

function sanitizeLimit(limit: number | undefined): number {
  const defaultLimit = 50;
  const maxLimit = 200;
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return defaultLimit;
  }

  const rounded = Math.trunc(limit);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > maxLimit) {
    return maxLimit;
  }
  return rounded;
}

function sanitizeOffset(offset: number | undefined): number {
  if (typeof offset !== "number" || Number.isNaN(offset)) {
    return 0;
  }

  const rounded = Math.trunc(offset);
  return rounded < 0 ? 0 : rounded;
}

function getVersionDirectoryPath(scopeCode: string): string {
  return `scope/${scopeCode.toLowerCase()}/versions/`;
}

function getVersionIndexPath(scopeCode: string): string {
  return `${getVersionDirectoryPath(scopeCode)}index.json`;
}

function getVersionSnapshotPath(scopeCode: string, versionId: string): string {
  return `${getVersionDirectoryPath(scopeCode)}${versionId}.json`;
}

function isVersionSnapshotPath(path: string, scopeCode: string): boolean {
  const prefix = getVersionDirectoryPath(scopeCode);
  return (
    path.startsWith(prefix) &&
    path.endsWith(".json") &&
    !path.endsWith("index.json")
  );
}

function getVersionIdFromPath(path: string): string {
  const segments = path.split("/");
  const fileName = segments.at(-1) || "";
  return fileName.replace(VERSION_FILE_EXTENSION_REGEX, "");
}

function computeVersionChange(
  previousPayload: unknown,
  currentPayload: unknown,
): ConfigurationVersion["change"] {
  const previous = getConfigNameValueMap(previousPayload);
  const current = getConfigNameValueMap(currentPayload);

  const added: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];

  for (const [name, value] of current.entries()) {
    if (!previous.has(name)) {
      added.push(name);
      continue;
    }

    if (previous.get(name) !== value) {
      updated.push(name);
    }
  }

  for (const name of previous.keys()) {
    if (!current.has(name)) {
      removed.push(name);
    }
  }

  return { added, updated, removed };
}

function getConfigNameValueMap(payload: unknown): Map<string, string> {
  const entries = new Map<string, string>();
  if (!isPayloadWithConfig(payload)) {
    return entries;
  }

  for (const entry of payload.config) {
    if (
      entry &&
      typeof entry === "object" &&
      "name" in entry &&
      "value" in entry &&
      typeof entry.name === "string"
    ) {
      const serializedValue = JSON.stringify(entry.value);
      entries.set(entry.name, serializedValue ?? "null");
    }
  }
  return entries;
}

function isPayloadWithConfig(
  payload: unknown,
): payload is { config: Array<{ name: string; value: unknown }> } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "config" in payload &&
    Array.isArray(payload.config)
  );
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (("statusCode" in error && error.statusCode === 404) ||
      ("code" in error && error.code === "ENOENT"))
  );
}
