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
import * as v from "valibot";

import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPasswordFields } from "#modules/schema/utils";
import { decrypt } from "#utils/encryption";
import { getLogger } from "#utils/logger";
import { getSharedFiles } from "#utils/repository";

import { persistConfig } from "../configuration/configuration-repository";

import type {
  ConfigurationVersion,
  GetConfigurationResponse,
  GetConfigurationVersionsParams,
  VersionChangeEntry,
} from "#types/api";
import type { ConfigContext } from "../configuration/types";

const ValueSchema = v.union([v.string(), v.boolean(), v.array(v.string())]);
const ScopeSchema = v.object({
  code: v.string(),
  id: v.string(),
  level: v.string(),
});
const SnapshotSchema = v.object({
  config: v.array(
    v.object({
      name: v.string(),
      origin: v.object({ code: v.string(), level: v.string() }),
      value: ValueSchema,
    }),
  ),
  scope: ScopeSchema,
});
const RecordSchema = v.object({
  change: v.object({
    added: v.array(v.string()),
    removed: v.array(v.string()),
    updated: v.array(v.string()),
  }),
  changes: v.array(
    v.object({
      after: v.optional(ValueSchema),
      before: v.optional(ValueSchema),
      name: v.string(),
    }),
  ),
  id: v.pipe(v.string(), v.uuid()),
  passwordFields: v.array(v.string()),
  reason: v.picklist(["set", "restore"]),
  restoredFromVersionId: v.optional(v.string()),
  scope: ScopeSchema,
  snapshot: SnapshotSchema,
  timestamp: v.pipe(v.string(), v.isoTimestamp()),
});
const PageSchema = v.object({
  limit: v.optional(
    v.pipe(v.number(), v.safeInteger(), v.minValue(1), v.maxValue(200)),
    50,
  ),
  offset: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(0)), 0),
});
const VERSION_FILE_PATTERN = /^[0-9a-f-]{36}\.json$/u;

type VersionRecord = v.InferOutput<typeof RecordSchema>;
type Snapshot = v.InferOutput<typeof SnapshotSchema>;

/** Identifies a missing file without hiding unrelated storage failures. */
export function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (("code" in error &&
      (error.code === "ENOENT" || error.code === "ERROR_FILE_NOT_EXISTS")) ||
      ("statusCode" in error && error.statusCode === 404))
  );
}

function directory(scopeId: string) {
  return `versions/${encodeURIComponent(scopeId)}/`;
}

function parseSnapshotJson(content: Buffer): unknown {
  try {
    return JSON.parse(content.toString("utf8"));
  } catch (cause) {
    throw new Error("VERSION_SNAPSHOT_INVALID: invalid JSON", { cause });
  }
}

/** Lists immutable snapshot IDs in descending creation order. */
export async function listVersionIds(scopeId: string): Promise<string[]> {
  const files = await getSharedFiles();
  const prefix = directory(scopeId);
  const entries = await files.list(prefix);
  return entries
    .filter(
      (file) =>
        file.name.startsWith(prefix) &&
        VERSION_FILE_PATTERN.test(file.name.slice(prefix.length)),
    )
    .map((file) => file.name.slice(prefix.length, -5))
    .sort((left, right) => right.localeCompare(left));
}

/** Reads and validates a version, including its scope-local snapshot. */
export async function readVersionRecord(
  scope: GetConfigurationResponse["scope"],
  versionId: string,
): Promise<VersionRecord | null> {
  if (!v.is(v.pipe(v.string(), v.uuid()), versionId)) {
    throw new Error("INVALID_PARAMS: versionId must be a UUID");
  }
  const files = await getSharedFiles();
  let content: Buffer;
  try {
    content = await files.read(`${directory(scope.id)}${versionId}.json`);
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }
    throw error;
  }
  const parsed = parseSnapshotJson(content);
  const result = v.safeParse(RecordSchema, parsed);
  if (
    !result.success ||
    result.output.id !== versionId ||
    result.output.scope.id !== scope.id ||
    result.output.scope.code !== scope.code ||
    result.output.scope.level !== scope.level ||
    result.output.snapshot.scope.id !== scope.id ||
    result.output.snapshot.scope.code !== scope.code ||
    result.output.snapshot.scope.level !== scope.level
  ) {
    throw new Error("VERSION_SNAPSHOT_INVALID: invalid record or scope");
  }
  return result.output;
}

/** Validates paging for SDK callers as well as HTTP callers. */
export function parseVersionPage(params: GetConfigurationVersionsParams = {}) {
  const result = v.safeParse(PageSchema, params);
  if (!result.success) {
    throw new Error(
      "INVALID_PARAMS: limit must be 1-200 and offset must be a non-negative safe integer",
    );
  }
  return result.output;
}

/** Loads authoritative overrides without trusting a potentially stale state cache. */
export async function readCurrentSnapshot(
  scope: GetConfigurationResponse["scope"],
): Promise<Snapshot> {
  const files = await getSharedFiles();
  let content: Buffer;
  try {
    content = await files.read(
      `scope/${scope.code.toLowerCase()}/configuration.json`,
    );
  } catch (error) {
    if (isMissingFile(error)) {
      return { config: [], scope };
    }
    throw error;
  }
  const parsed = parseSnapshotJson(content);
  const result = v.safeParse(SnapshotSchema, parsed);
  if (!result.success) {
    throw new Error(
      "VERSION_SNAPSHOT_INVALID: invalid persisted configuration",
    );
  }
  return { config: result.output.config, scope };
}

/** Checks a caller's latest-version precondition before changing configuration. */
export async function assertLatestVersion(
  scopeId: string,
  expectedLatestVersionId?: string,
) {
  if (expectedLatestVersionId === undefined) {
    return;
  }
  if (!v.is(v.pipe(v.string(), v.uuid()), expectedLatestVersionId)) {
    throw new Error("INVALID_PARAMS: expectedLatestVersionId must be a UUID");
  }
  const [latest] = await listVersionIds(scopeId);
  if (latest !== expectedLatestVersionId) {
    throw new Error(
      "VERSION_CONFLICT: latest version does not match expectedLatestVersionId",
    );
  }
}

function changedEntries(
  previous: Snapshot,
  next: Snapshot,
  passwordFields: Set<string>,
  encryptionKey?: string,
) {
  const before = new Map(
    previous.config.map((entry) => [entry.name, entry.value]),
  );
  const after = new Map(next.config.map((entry) => [entry.name, entry.value]));
  const change: ConfigurationVersion["change"] = {
    added: [],
    removed: [],
    updated: [],
  };
  const changes: VersionChangeEntry[] = [];
  for (const [name, value] of after) {
    if (before.has(name)) {
      const oldValue = before.get(name);
      const comparable = (entry: typeof value | undefined) =>
        passwordFields.has(name) &&
        encryptionKey &&
        typeof entry === "string" &&
        entry.length > 0
          ? decrypt(entry, encryptionKey)
          : entry;
      if (
        JSON.stringify(oldValue) !== JSON.stringify(value) &&
        JSON.stringify(comparable(oldValue)) !==
          JSON.stringify(comparable(value))
      ) {
        change.updated.push(name);
        changes.push({ after: value, before: oldValue, name });
      }
    } else {
      change.added.push(name);
      changes.push({ after: value, name });
    }
  }
  for (const [name, value] of before) {
    if (!after.has(name)) {
      change.removed.push(name);
      changes.push({ before: value, name });
    }
  }
  return { change, changes };
}

/** Persists business configuration and records its encrypted scope-local snapshot. */
export async function persistVersionedConfig(
  context: ConfigContext,
  previous: Snapshot,
  payload: GetConfigurationResponse,
  options: { reason: "set" | "restore"; restoredFromVersionId?: string },
) {
  const snapshot = v.parse(SnapshotSchema, payload);
  const passwordFields = getPasswordFields(requireGlobalSchema());
  const record: VersionRecord = {
    ...changedEntries(
      previous,
      snapshot,
      passwordFields,
      context.encryptionKey,
    ),
    id: uuidv7(),
    passwordFields: [...passwordFields],
    reason: options.reason,
    restoredFromVersionId: options.restoredFromVersionId,
    scope: snapshot.scope,
    snapshot,
    timestamp: new Date().toISOString(),
  };
  const files = await getSharedFiles();
  await persistConfig(snapshot.scope.code, snapshot, context.cacheTimeout);
  try {
    await files.write(
      `${directory(snapshot.scope.id)}${record.id}.json`,
      JSON.stringify(record),
    );
  } catch (cause) {
    getLogger("@adobe/aio-commerce-lib-config:versioning").error(
      "Configuration was saved but its version snapshot could not be written",
      { scopeId: snapshot.scope.id, versionId: record.id },
    );
    throw new Error(
      "VERSION_WRITE_FAILED: configuration was saved but history was not recorded",
      { cause },
    );
  }
}

/** Masks historical password fields even if their schema definition has since changed. */
export function toVersionMetadata(record: VersionRecord): ConfigurationVersion {
  const passwords = new Set([
    ...record.passwordFields,
    ...getPasswordFields(requireGlobalSchema()),
  ]);
  return {
    change: record.change,
    changes: record.changes.map((entry) =>
      passwords.has(entry.name)
        ? {
            ...entry,
            ...(entry.before === undefined ? {} : { before: "*****" }),
            ...(entry.after === undefined ? {} : { after: "*****" }),
          }
        : entry,
    ),
    config: record.snapshot.config.map(({ name, value }) => ({
      name,
      value: passwords.has(name) ? "*****" : value,
    })),
    id: record.id,
    reason: record.reason,
    restoredFromVersionId: record.restoredFromVersionId,
    scope: record.scope,
    timestamp: record.timestamp,
  };
}
