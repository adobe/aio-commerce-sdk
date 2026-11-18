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

const paginationMessage =
  "INVALID_PAGINATION: limit must be 1-1000 and offset must be a non-negative safe integer";
const dateMessage =
  "INVALID_AUDIT_DATES: startDate and endDate must be valid dates in ascending order";
const AuditDateSchema = v.pipe(
  v.string(dateMessage),
  v.transform((value) => Date.parse(value)),
  v.finite(dateMessage),
);
const AuditQuerySchema = v.pipe(
  v.object({
    endDate: v.optional(AuditDateSchema),
    limit: v.optional(
      v.pipe(
        v.number(paginationMessage),
        v.safeInteger(paginationMessage),
        v.minValue(1, paginationMessage),
        v.maxValue(1000, paginationMessage),
      ),
      50,
    ),
    offset: v.optional(
      v.pipe(
        v.number(paginationMessage),
        v.safeInteger(paginationMessage),
        v.minValue(0, paginationMessage),
      ),
      0,
    ),
    startDate: v.optional(AuditDateSchema),
    userId: v.optional(v.string()),
  }),
  v.transform((query) => ({
    ...query,
    endDate: query.endDate ?? Number.POSITIVE_INFINITY,
    startDate: query.startDate ?? Number.NEGATIVE_INFINITY,
  })),
  v.check(({ startDate, endDate }) => startDate <= endDate, dateMessage),
);

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
  scopeId?: string,
) {
  const { limit, offset, startDate, endDate, userId } = v.parse(
    AuditQuerySchema,
    request,
  );
  const all = await listAuditEntries(namespace);
  const entries = all.filter(
    (entry) =>
      (scopeId === undefined || entry.scope.id === scopeId) &&
      (userId === undefined || entry.actor.userId === userId) &&
      Date.parse(entry.timestamp) >= startDate &&
      Date.parse(entry.timestamp) <= endDate,
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
