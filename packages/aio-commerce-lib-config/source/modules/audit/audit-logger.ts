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

import { v7 as generateUUID } from "uuid";
import * as v from "valibot";

import { AuditEntrySchema, serializeAudit } from "#utils/audit-storage";

import { listAuditEntries } from "./audit-repository";
import { calculateDiff } from "./diff-calculator";
import { redactSensitiveDiffs } from "./secret-redaction";

import type { ConfigValue } from "#modules/configuration/types";
import type { AuditActor, AuditEntry, GetAuditLogRequest } from "./types";

/** Prepares only changed fields and permitted actor metadata before live persistence. */
export function prepareAuditEntry(
  scope: AuditEntry["scope"],
  before: ConfigValue[],
  after: ConfigValue[],
  passwordFields: ReadonlySet<string>,
  actor?: AuditActor,
) {
  const changes = redactSensitiveDiffs(
    calculateDiff(before, after),
    passwordFields,
  );
  if (changes.length === 0) {
    return null;
  }
  const entry = v.parse(AuditEntrySchema, {
    actor: { source: actor?.source, userId: actor?.userId },
    changes,
    id: generateUUID(),
    scope,
    timestamp: new Date().toISOString(),
  });
  serializeAudit(entry);
  return entry;
}

/** Filters, sorts, and paginates audit records without modifying live configuration. */
export async function queryAuditLog(
  namespace: string,
  request: GetAuditLogRequest = {},
) {
  const limit = request.limit ?? 50;
  const offset = request.offset ?? 0;
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
  const all = await listAuditEntries(namespace);
  const entries = all.filter(
    (entry) =>
      (request.scopeCode === undefined ||
        entry.scope.code.toLowerCase() === request.scopeCode.toLowerCase()) &&
      (request.userId === undefined || entry.actor.userId === request.userId) &&
      Date.parse(entry.timestamp) >= start &&
      Date.parse(entry.timestamp) <= end,
  );
  entries.sort(
    (a, b) =>
      Date.parse(b.timestamp) - Date.parse(a.timestamp) ||
      b.id.localeCompare(a.id),
  );
  return {
    entries: entries.slice(offset, offset + limit),
    pagination: {
      hasMore: offset + limit < entries.length,
      limit,
      offset,
      total: entries.length,
    },
  };
}
