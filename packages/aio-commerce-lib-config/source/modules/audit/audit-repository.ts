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

import { getSharedState } from "#utils/repository";
import { PERSISTENT_TTL } from "#utils/storage-limits";

import type { AuditEntry } from "./types";

const AUDIT_KEY_PREFIX = "audit";
const AUDIT_LIST_KEY_PREFIX = "audit-list";
const _AUDIT_METADATA_KEY = "audit-metadata";

/**
 * Generates a storage key for an audit entry.
 */
function getAuditKey(auditId: string): string {
  return `${AUDIT_KEY_PREFIX}:${auditId}`;
}

/**
 * Generates a storage key for the audit list.
 */
function getAuditListKey(scopeCode?: string): string {
  return scopeCode
    ? `${AUDIT_LIST_KEY_PREFIX}:${scopeCode}`
    : AUDIT_LIST_KEY_PREFIX;
}

/**
 * Saves an audit entry to storage.
 *
 * @param namespace - Storage namespace.
 * @param entry - Audit entry to save.
 */
/**
 * Saves an audit entry to storage.
 *
 * @param _namespace - Storage namespace (reserved for future multi-tenancy).
 * @param entry - Audit entry to save.
 * @see https://developer.adobe.com/commerce/extensibility/app-development/best-practices/database-storage/
 */
export async function saveAuditEntry(
  _namespace: string,
  entry: AuditEntry,
): Promise<void> {
  const state = await getSharedState();
  const key = getAuditKey(entry.id);
  await state.put(key, JSON.stringify(entry), { ttl: PERSISTENT_TTL });
}

/**
 * Appends an audit entry ID to the audit list.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code (optional, for scope-specific lists).
 * @param auditId - Audit entry ID.
 */
export async function appendToAuditList(
  _namespace: string,
  scopeCode: string,
  auditId: string,
): Promise<void> {
  const state = await getSharedState();
  const key = getAuditListKey(scopeCode);

  let auditList: string[] = [];
  try {
    const result = await state.get(key);
    if (result?.value) {
      auditList = JSON.parse(result.value) as string[];
    }
  } catch {
    // List doesn't exist yet
  }

  auditList.push(auditId);
  await state.put(key, JSON.stringify(auditList), { ttl: PERSISTENT_TTL });
}

/**
 * Gets an audit entry by ID.
 *
 * @param namespace - Storage namespace.
 * @param auditId - Audit entry ID.
 * @returns Audit entry or null if not found.
 */
export async function getAuditEntry(
  _namespace: string,
  auditId: string,
): Promise<AuditEntry | null> {
  const state = await getSharedState();
  const key = getAuditKey(auditId);

  try {
    const result = await state.get(key);
    if (result?.value) {
      return JSON.parse(result.value) as AuditEntry;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Gets the audit list for a scope.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code (optional).
 * @returns Array of audit entry IDs.
 */
export async function getAuditList(
  _namespace: string,
  scopeCode?: string,
): Promise<string[]> {
  const state = await getSharedState();
  const key = getAuditListKey(scopeCode);

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
 * Gets multiple audit entries by their IDs.
 *
 * @param namespace - Storage namespace.
 * @param auditIds - Array of audit entry IDs.
 * @returns Array of audit entries (null for not found).
 */
export function getAuditEntries(
  namespace: string,
  auditIds: string[],
): Promise<(AuditEntry | null)[]> {
  return Promise.all(auditIds.map((id) => getAuditEntry(namespace, id)));
}

/**
 * Gets the last audit entry hash for chain verification.
 *
 * @param namespace - Storage namespace.
 * @param scopeCode - Scope code.
 * @returns Last audit entry hash or null if no entries exist.
 */
export async function getLastAuditHash(
  namespace: string,
  scopeCode: string,
): Promise<string | null> {
  const auditIds = await getAuditList(namespace, scopeCode);

  if (auditIds.length === 0) {
    return null;
  }

  const lastAuditId = auditIds.at(-1);
  if (!lastAuditId) {
    return null;
  }

  const lastEntry = await getAuditEntry(namespace, lastAuditId);

  return lastEntry?.integrityHash ?? null;
}
