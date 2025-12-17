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

import crypto from "node:crypto";

import { redactSensitiveDiffs } from "#modules/versioning/secret-redaction";
import { fetchPaginatedEntities } from "#utils/pagination";
import { generateUUID } from "#utils/uuid";
import { DEFAULT_AUDIT_LOG_LIMIT } from "#utils/versioning-constants";

import * as auditRepository from "./audit-repository";

import type {
  AuditContext,
  AuditEntry,
  CreateAuditEntryRequest,
  GetAuditLogRequest,
  GetAuditLogResponse,
} from "./types";

/**
 * Hash algorithm used for audit entry integrity verification.
 */
const HASH_ALGORITHM = "sha256" as const;

/**
 * Hash output encoding format.
 */
const HASH_ENCODING = "hex" as const;

/**
 * Calculates integrity hash for an audit entry using SHA-256.
 *
 * This creates a tamper-proof hash of the audit entry that can be used
 * to verify the integrity of the audit chain.
 *
 * @param entry - Audit entry data (without hash).
 * @param previousHash - Hash of previous audit entry (for chain).
 * @returns Hex-encoded SHA-256 hash.
 */
function calculateIntegrityHash(
  entry: Omit<AuditEntry, "integrityHash">,
  previousHash: string | null,
): string {
  const hashableData = createHashableData(entry, previousHash);
  return generateHash(hashableData);
}

/**
 * Creates a normalized data structure for hashing.
 *
 * @param entry - Audit entry.
 * @param previousHash - Previous entry hash.
 * @returns Object ready for hashing.
 */
function createHashableData(
  entry: Omit<AuditEntry, "integrityHash">,
  previousHash: string | null,
) {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    scope: entry.scope,
    versionId: entry.versionId,
    actor: entry.actor,
    changes: entry.changes,
    previousHash,
    action: entry.action,
  };
}

/**
 * Generates a cryptographic hash from data.
 *
 * @param data - Data to hash.
 * @returns Hex-encoded hash string.
 */
function generateHash(data: unknown): string {
  const hash = crypto.createHash(HASH_ALGORITHM);
  hash.update(JSON.stringify(data));
  return hash.digest(HASH_ENCODING);
}

/**
 * Creates an audit log entry for a configuration change.
 *
 * @param context - Audit context.
 * @param request - Audit entry creation request.
 * @returns Created audit entry.
 */
export async function logChange(
  context: AuditContext,
  request: CreateAuditEntryRequest,
): Promise<AuditEntry> {
  const { scope, versionId, actor, changes, action } = request;

  const previousChainHash = await auditRepository.getLastAuditHash(
    context.namespace,
    scope.code,
  );

  const gdprCompliantChanges = redactSensitiveDiffs(changes);
  const auditEntry = buildAuditEntry({
    scope,
    versionId,
    actor,
    changes: gdprCompliantChanges,
    action,
    previousHash: previousChainHash,
  });

  await persistAuditEntry(context, auditEntry);

  return auditEntry;
}

/**
 * Parameters for building an audit entry.
 */
type BuildAuditEntryParams = {
  scope: CreateAuditEntryRequest["scope"];
  versionId: string;
  actor: CreateAuditEntryRequest["actor"];
  changes: ReturnType<typeof redactSensitiveDiffs>;
  action: CreateAuditEntryRequest["action"];
  previousHash: string | null;
};

/**
 * Builds a complete audit entry with integrity hash.
 */
function buildAuditEntry(params: BuildAuditEntryParams): AuditEntry {
  const entryWithoutHash: Omit<AuditEntry, "integrityHash"> = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    scope: params.scope,
    versionId: params.versionId,
    actor: params.actor,
    changes: params.changes,
    previousHash: params.previousHash,
    action: params.action,
  };

  const integrityHash = calculateIntegrityHash(
    entryWithoutHash,
    params.previousHash,
  );

  return {
    ...entryWithoutHash,
    integrityHash,
  };
}

/**
 * Persists audit entry to storage and updates audit list.
 */
async function persistAuditEntry(
  context: AuditContext,
  auditEntry: AuditEntry,
) {
  await auditRepository.saveAuditEntry(context.namespace, auditEntry);
  await auditRepository.appendToAuditList(
    context.namespace,
    auditEntry.scope.code,
    auditEntry.id,
  );
}

/**
 * Gets audit log entries with filtering and pagination.
 *
 * WARNING: Loads all entries into memory due to lib-state limitations.
 * Performance degrades significantly beyond 1,000 entries.
 * Consider archiving old logs or time-based filtering for larger datasets.
 *
 * @param context - Audit context.
 * @param request - Audit log query request.
 * @returns Audit log entries with pagination.
 */
export async function getAuditLog(
  context: AuditContext,
  request: GetAuditLogRequest,
): Promise<GetAuditLogResponse> {
  const {
    scopeCode,
    userId,
    action,
    startDate,
    endDate,
    limit = DEFAULT_AUDIT_LOG_LIMIT,
    offset = 0,
  } = request;

  const auditIdIndex = await auditRepository.getAuditList(
    context.namespace,
    scopeCode,
  );

  const allAuditEntries = await auditRepository.getAuditEntries(
    context.namespace,
    auditIdIndex,
  );

  const validEntries = filterNullEntries(allAuditEntries);
  const matchingEntries = applyAuditFilters(validEntries, {
    userId,
    action,
    startDate,
    endDate,
  });

  const newestFirstEntries = matchingEntries.reverse();

  const fetchAuditById = (id: string) => {
    const entry = newestFirstEntries.find((e) => e.id === id);
    return Promise.resolve(entry ?? null);
  };

  const entryIds = newestFirstEntries.map((e) => e.id);
  const paginatedResult = await fetchPaginatedEntities(
    entryIds,
    fetchAuditById,
    limit,
    offset,
  );

  return {
    entries: paginatedResult.items,
    pagination: paginatedResult.pagination,
  };
}

/**
 * Filters out null entries from audit entry array.
 */
function filterNullEntries(entries: (AuditEntry | null)[]): AuditEntry[] {
  return entries.filter((entry): entry is AuditEntry => entry !== null);
}

/**
 * Filters audit entries by user, action, and date range.
 */
function applyAuditFilters(
  entries: AuditEntry[],
  filters: {
    userId?: string;
    action?: "create" | "update" | "rollback";
    startDate?: string;
    endDate?: string;
  },
): AuditEntry[] {
  return entries.filter((entry) => {
    if (filters.userId && entry.actor.userId !== filters.userId) {
      return false;
    }

    if (filters.action && entry.action !== filters.action) {
      return false;
    }

    if (filters.startDate && entry.timestamp < filters.startDate) {
      return false;
    }

    if (filters.endDate && entry.timestamp > filters.endDate) {
      return false;
    }

    return true;
  });
}

/**
 * Verifies the integrity chain of audit logs for a scope.
 *
 * @param context - Audit context.
 * @param scopeCode - Scope code.
 * @returns Validation result with broken entry ID if invalid.
 */
export async function verifyAuditChain(
  context: AuditContext,
  scopeCode: string,
): Promise<{ valid: boolean; brokenAt?: string }> {
  const auditIds = await auditRepository.getAuditList(
    context.namespace,
    scopeCode,
  );

  const auditEntries = await auditRepository.getAuditEntries(
    context.namespace,
    auditIds,
  );

  return validateAuditChainIntegrity(auditEntries);
}

/**
 * Validates the integrity of an audit chain by verifying hashes.
 *
 * Each entry's previousHash must match the previous entry's integrityHash,
 * and each integrityHash must be correctly calculated.
 */
function validateAuditChainIntegrity(entries: (AuditEntry | null)[]): {
  valid: boolean;
  brokenAt?: string;
} {
  let expectedPreviousHash: string | null = null;

  for (const entry of entries) {
    if (!entry) {
      continue;
    }

    const chainBroken = isChainBrokenAtEntry(entry, expectedPreviousHash);
    if (chainBroken) {
      return { valid: false, brokenAt: entry.id };
    }

    expectedPreviousHash = entry.integrityHash;
  }

  return { valid: true };
}

/**
 * Checks if audit chain is broken at a specific entry.
 *
 * Verifies:
 * 1. Previous hash matches expected value
 * 2. Integrity hash is correctly calculated
 */
function isChainBrokenAtEntry(
  entry: AuditEntry,
  expectedPreviousHash: string | null,
): boolean {
  if (entry.previousHash !== expectedPreviousHash) {
    return true;
  }

  const { integrityHash, ...entryWithoutHash } = entry;
  const recalculatedHash = calculateIntegrityHash(
    entryWithoutHash,
    expectedPreviousHash,
  );

  return recalculatedHash !== integrityHash;
}
