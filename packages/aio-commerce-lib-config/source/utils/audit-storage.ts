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

const MAX_AUDIT_SIZE = 10 * 1024 * 1024;
const nibblePattern = /^[a-f0-9]$/u;
const recordNamePattern = /^[a-f0-9]{64}\.json$/u;
const ValueSchema = v.optional(
  v.union([v.string(), v.boolean(), v.array(v.string())]),
);
const OriginSchema = v.strictObject({ code: v.string(), level: v.string() });
export const AuditEntrySchema = v.strictObject({
  actor: v.strictObject({
    source: v.optional(v.string()),
    userId: v.optional(v.string()),
  }),
  changes: v.array(
    v.strictObject({
      name: v.string(),
      newOrigin: v.optional(OriginSchema),
      newValue: ValueSchema,
      oldOrigin: v.optional(OriginSchema),
      oldValue: ValueSchema,
      type: v.picklist(["added", "modified", "removed"]),
    }),
  ),
  id: v.string(),
  scope: v.strictObject({
    code: v.string(),
    id: v.string(),
    level: v.string(),
  }),
  timestamp: v.pipe(v.string(), v.isoTimestamp()),
});

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Builds a namespace-isolated audit prefix without caller-controlled path components. */
export function auditPrefix(namespace: string) {
  return `audit/${digest(namespace)}/`;
}

/** Builds a partitioned path for one uniquely identified audit record. */
export function auditPath(namespace: string, id: string) {
  const hash = digest(id);
  return `${auditPrefix(namespace)}${[...hash].join("/")}/${hash}.json`;
}

/** Serializes a validated record and rejects oversized audit payloads before live writes. */
export function serializeAudit(value: v.InferOutput<typeof AuditEntrySchema>) {
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > MAX_AUDIT_SIZE) {
    throw new Error("AUDIT_SIZE_LIMIT: audit records must not exceed 10 MiB");
  }
  return serialized;
}

/** Reads validated JSON; storage failures, missing records, and corrupt data reject queries. */
export async function readAuditFile(path: string) {
  const files = await getSharedFiles();
  const contents = await files.read(path);
  if (contents.length > MAX_AUDIT_SIZE) {
    throw new Error("AUDIT_SIZE_LIMIT: audit records must not exceed 10 MiB");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents.toString());
  } catch (error) {
    throw new Error("CORRUPT_AUDIT: invalid JSON", { cause: error });
  }
  const result = v.safeParse(AuditEntrySchema, parsed);
  if (!result.success) {
    throw new Error("CORRUPT_AUDIT: invalid record");
  }
  return result.output;
}

/** Lists all partitions so the Files client's first-page cap cannot silently hide records. */
export async function listAuditPaths(
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
      throw new Error("CORRUPT_AUDIT: unexpected record path");
    }
    return file.name;
  });
  if (listed.length < 1000) {
    return paths;
  }
  if (depth >= 64) {
    throw new Error("CORRUPT_AUDIT: overfull leaf partition");
  }
  const partitions = await Promise.all(
    [..."0123456789abcdef"].map((nibble) =>
      listAuditPaths(`${prefix}${nibble}/`, depth + 1),
    ),
  );
  return partitions.flat();
}
