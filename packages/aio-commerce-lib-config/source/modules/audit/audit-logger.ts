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

import stringify from "safe-stable-stringify";
import { v7 as generateUUID } from "uuid";
import * as v from "valibot";

import {
  AuditEntrySchema,
  paginate,
  serializeHistory,
} from "#utils/history-storage";

import { ensureAuditScope, listAuditEntries } from "./audit-repository";

import type {
  AuditContext,
  AuditEntry,
  AuditVerificationResult,
  CreateAuditEntryRequest,
  GetAuditLogRequest,
} from "./types";

/** Hashes all record fields except the stored digest, with stable object key ordering. */
function generateHash(entry: Omit<AuditEntry, "integrityHash">) {
  const serialized = stringify(entry);
  if (serialized === undefined) {
    throw new Error("INVALID_AUDIT_ENTRY: record cannot be serialized");
  }
  return createHash("sha256").update(serialized).digest("hex");
}

/** Validates the record hashes and topology independently of listing or timestamp order. */
export function verifyEntries(entries: AuditEntry[]): AuditVerificationResult {
  const children = new Map<string | null, AuditEntry>();
  const hashes = new Set<string>();
  for (const entry of entries) {
    const { integrityHash, ...content } = entry;
    if (generateHash(content) !== integrityHash || hashes.has(integrityHash)) {
      return invalid(
        entries.length,
        "Record hash mismatch or duplicate hash",
        entry.id,
      );
    }
    if (children.has(entry.previousHash)) {
      return invalid(
        entries.length,
        "Audit chain has multiple roots or a concurrent-write fork",
        entry.id,
      );
    }
    children.set(entry.previousHash, entry);
    hashes.add(integrityHash);
  }
  let headHash: string | null = null;
  let visited = 0;
  let entry = children.get(null);
  while (entry && visited < entries.length) {
    headHash = entry.integrityHash;
    visited += 1;
    entry = children.get(headHash);
  }
  if (visited !== entries.length || entry) {
    return invalid(
      entries.length,
      "Audit chain is disconnected, cyclic, or missing a record",
    );
  }
  return { entriesChecked: entries.length, headHash, valid: true };
}

function invalid(
  entriesChecked: number,
  reason: string,
  brokenAt?: string,
): AuditVerificationResult {
  return { brokenAt, entriesChecked, headHash: null, reason, valid: false };
}

/** Prepares a linked, validated audit record before persisting a configuration change. */
export async function prepareAuditEntry(
  context: AuditContext,
  request: CreateAuditEntryRequest,
) {
  const chain = await verifyAuditChain(context, request.scope.code);
  if (!chain.valid) {
    throw new Error(`INVALID_AUDIT_CHAIN: ${chain.reason}`);
  }
  const content = {
    ...request,
    id: generateUUID(),
    previousHash: chain.headHash,
    timestamp: new Date().toISOString(),
  };
  const entry = v.parse(AuditEntrySchema, {
    ...content,
    integrityHash: generateHash(content),
  });
  serializeHistory(entry);
  await ensureAuditScope(context.namespace, request.scope);
  return entry;
}

/** Filters entries in one pass, then sorts and paginates without repeated ID lookups. */
export async function getAuditLog(
  context: AuditContext,
  request: GetAuditLogRequest = {},
) {
  paginate([], request, 50);
  if (
    request.action !== undefined &&
    !["create", "update", "rollback"].includes(request.action)
  ) {
    throw new Error(
      "INVALID_AUDIT_ACTION: expected create, update, or rollback",
    );
  }
  const start =
    request.startDate === undefined
      ? Number.NEGATIVE_INFINITY
      : Date.parse(request.startDate);
  const end =
    request.endDate === undefined
      ? Number.POSITIVE_INFINITY
      : Date.parse(request.endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    throw new Error(
      "INVALID_AUDIT_DATES: startDate and endDate must be valid dates in ascending order",
    );
  }
  const all = await listAuditEntries(context.namespace, request.scopeCode);
  const entries = all.filter(
    (entry) =>
      (request.userId === undefined || entry.actor.userId === request.userId) &&
      (request.action === undefined || entry.action === request.action) &&
      Date.parse(entry.timestamp) >= start &&
      Date.parse(entry.timestamp) <= end,
  );
  entries.sort(
    (a, b) =>
      Date.parse(b.timestamp) - Date.parse(a.timestamp) ||
      b.id.localeCompare(a.id),
  );
  const page = paginate(entries, request, 50);
  return { entries: page.items, pagination: page.pagination };
}

/** Verifies one chain and optionally checks a head hash stored outside the history store. */
export async function verifyAuditChain(
  context: AuditContext,
  scopeCode: string,
  expectedHeadHash?: string,
) {
  const result = verifyEntries(
    await listAuditEntries(context.namespace, scopeCode),
  );
  if (
    result.valid &&
    expectedHeadHash !== undefined &&
    result.headHash !== expectedHeadHash
  ) {
    return invalid(
      result.entriesChecked,
      "Audit chain does not match the trusted head hash",
    );
  }
  return result;
}
