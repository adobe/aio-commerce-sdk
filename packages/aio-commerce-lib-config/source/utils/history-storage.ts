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

import { createHash } from "node:crypto";

import * as v from "valibot";

import { getSharedFiles } from "./repository";
import { StorageLimitExceededError, serializeJson } from "./storage-limits";

export const MAX_HISTORY_SIZE = 10 * 1024 * 1024;
export const ARCHIVE_SIZE_THRESHOLD = 900 * 1024;
const hashPattern = /^[a-f0-9]{64}$/u;
const nibblePattern = /^[a-f0-9]$/u;
const recordNamePattern = /^[a-f0-9]{64}\.json$/u;
const collections = ["versions", "archives", "audit", "audit-scopes"] as const;
type HistoryCollection = (typeof collections)[number];

const ValueSchema = v.optional(
  v.union([v.string(), v.boolean(), v.array(v.string())]),
);
const OriginSchema = v.strictObject({ code: v.string(), level: v.string() });
export const ScopeSchema = v.strictObject({
  code: v.string(),
  id: v.string(),
  level: v.string(),
});
export const ActorSchema = v.strictObject({
  ipAddress: v.optional(v.string()),
  source: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  userId: v.optional(v.string()),
});
const TimestampSchema = v.pipe(v.string(), v.isoTimestamp());
export const ConfigValuesSchema = v.array(
  v.pipe(
    v.strictObject({
      name: v.string(),
      origin: OriginSchema,
      value: ValueSchema,
    }),
    v.transform((item) => ({ ...item, value: item.value })),
  ),
);
const DiffSchema = v.strictObject({
  name: v.string(),
  newOrigin: v.optional(OriginSchema),
  newValue: ValueSchema,
  oldOrigin: v.optional(OriginSchema),
  oldValue: ValueSchema,
  type: v.picklist(["added", "modified", "removed"]),
});
export const VersionSchema = v.strictObject({
  actor: v.optional(
    v.strictObject({
      source: v.optional(v.string()),
      userId: v.optional(v.string()),
    }),
  ),
  diff: v.array(DiffSchema),
  id: v.string(),
  previousVersionId: v.nullable(v.string()),
  scope: ScopeSchema,
  snapshot: ConfigValuesSchema,
  timestamp: TimestampSchema,
  versionNumber: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
});
export const ArchiveReferenceSchema = v.strictObject({
  archived: v.literal(true),
  archivedAt: TimestampSchema,
  archivePath: v.string(),
  id: v.string(),
  reason: v.picklist(["size", "age", "manual"]),
  sizeInBytes: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
});
export const VersionRecordSchema = v.union([
  VersionSchema,
  ArchiveReferenceSchema,
]);
export const AuditEntrySchema = v.strictObject({
  action: v.picklist(["create", "update", "rollback"]),
  actor: ActorSchema,
  changes: v.array(DiffSchema),
  id: v.string(),
  integrityHash: v.pipe(v.string(), v.regex(hashPattern)),
  previousHash: v.nullable(v.pipe(v.string(), v.regex(hashPattern))),
  scope: ScopeSchema,
  timestamp: TimestampSchema,
  versionId: v.string(),
});

/** Builds an isolated, path-safe collection prefix. */
export function historyPrefix(
  namespace: string,
  collection: HistoryCollection,
  scopeCode?: string,
) {
  const scope =
    scopeCode === undefined ? "" : `${digest(scopeCode.toLowerCase())}/`;
  return `history/${digest(namespace)}/${collection}/${scope}`;
}

/** Builds a record path without accepting caller-controlled path components. */
export function historyPath(
  namespace: string,
  collection: HistoryCollection,
  scopeCode: string,
  id: string,
) {
  const hash = digest(id);
  return `${historyPrefix(namespace, collection, scopeCode)}${[...hash].join("/")}/${hash}.json`;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Serializes a history record, rejecting unsupported or oversized input. */
export function serializeHistory(value: unknown) {
  const serialized = serializeJson(value);
  const size = Buffer.byteLength(serialized, "utf8");
  if (size > MAX_HISTORY_SIZE) {
    throw new StorageLimitExceededError(size, MAX_HISTORY_SIZE);
  }
  return serialized;
}

/** Reads validated JSON, distinguishing absence from invalid or inaccessible storage. */
export async function readHistoryFile<T extends v.GenericSchema>(
  path: string,
  schema: T,
) {
  const files = await getSharedFiles();
  let contents: Buffer;
  try {
    contents = await files.read(path);
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }
    throw error;
  }
  if (contents.length > MAX_HISTORY_SIZE) {
    throw new StorageLimitExceededError(contents.length, MAX_HISTORY_SIZE);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents.toString());
  } catch (error) {
    throw new Error(`CORRUPT_HISTORY: invalid JSON at ${path}`, {
      cause: error,
    });
  }
  const result = v.safeParse(schema, parsed);
  if (!result.success) {
    throw new Error(`CORRUPT_HISTORY: invalid record at ${path}`);
  }
  return result.output;
}

/** Lists only this library's path-safe history records. */
export async function listHistoryPaths(
  prefix: string,
  depth = 0,
): Promise<string[]> {
  const files = await getSharedFiles();
  const listed = await files.list(prefix);
  const paths = listed.map((file) => {
    const parts = file.name.slice(prefix.length).split("/");
    const name = parts.pop();
    if (
      !(file.name.startsWith(prefix) && name && recordNamePattern.test(name)) ||
      parts.length !== 64 - depth ||
      parts.some((part) => !nibblePattern.test(part))
    ) {
      throw new Error("CORRUPT_HISTORY: unexpected record path");
    }
    return file.name;
  });
  if (listed.length < 1000) {
    return paths;
  }
  // aio-lib-files truncates each listing at 1000 blobs, even when more records exist.
  if (depth >= 64) {
    throw new Error("CORRUPT_HISTORY: overfull leaf partition");
  }
  const partitions = await Promise.all(
    [..."0123456789abcdef"].map((nibble) =>
      listHistoryPaths(`${prefix}${nibble}/`, depth + 1),
    ),
  );
  return partitions.flat();
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (("code" in error &&
      (error.code === "ENOENT" || error.code === "ERROR_FILE_NOT_EXISTS")) ||
      ("statusCode" in error && error.statusCode === 404) ||
      ("status" in error && error.status === 404))
  );
}

/** Validates a paginated query and returns its requested slice with metadata. */
export function paginate<T>(
  items: T[],
  options: { limit?: number; offset?: number },
  defaultLimit: number,
) {
  const limit = options.limit ?? defaultLimit;
  const offset = options.offset ?? 0;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 1000 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    throw new Error(
      "INVALID_PAGINATION: limit must be 1-1000 and offset must be a non-negative safe integer",
    );
  }
  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      hasMore: offset + limit < items.length,
      limit,
      offset,
      total: items.length,
    },
  };
}
