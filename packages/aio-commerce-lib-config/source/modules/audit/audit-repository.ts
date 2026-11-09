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

import {
  AuditEntrySchema,
  historyPath,
  historyPrefix,
  listHistoryPaths,
  readHistoryFile,
  ScopeSchema,
  serializeHistory,
} from "#utils/history-storage";
import { getSharedFiles } from "#utils/repository";

import type { AuditEntry } from "./types";

/** Registers a scope before its first configuration/audit write, without a shared mutable scope index. */
export async function ensureAuditScope(
  namespace: string,
  scope: AuditEntry["scope"],
) {
  const path = historyPath(
    namespace,
    "audit-scopes",
    "all",
    scope.code.toLowerCase(),
  );
  const existing = await readHistoryFile(path, ScopeSchema);
  if (existing) {
    if (existing.code.toLowerCase() !== scope.code.toLowerCase()) {
      throw new Error(
        "CORRUPT_HISTORY: audit scope registry identity mismatch",
      );
    }
    return;
  }
  const files = await getSharedFiles();
  await files.write(path, serializeHistory(scope));
}

async function listAuditScopes(namespace: string) {
  const paths = await listHistoryPaths(
    historyPrefix(namespace, "audit-scopes", "all"),
  );
  return Promise.all(
    paths.map(async (path) => {
      const scope = await readHistoryFile(path, ScopeSchema);
      if (
        !scope ||
        path !==
          historyPath(
            namespace,
            "audit-scopes",
            "all",
            scope.code.toLowerCase(),
          )
      ) {
        throw new Error(
          "CORRUPT_HISTORY: audit scope registry record is missing or has a different identity",
        );
      }
      return scope.code;
    }),
  );
}

/** Reads scope-local or workspace-wide records, failing on missing or corrupt listed records. */
export async function listAuditEntries(
  namespace: string,
  scopeCode?: string,
): Promise<AuditEntry[]> {
  if (scopeCode === undefined) {
    const scopes = await listAuditScopes(namespace);
    return (
      await Promise.all(scopes.map((code) => listAuditEntries(namespace, code)))
    ).flat();
  }
  const paths = await listHistoryPaths(
    historyPrefix(namespace, "audit", scopeCode),
  );
  return Promise.all(
    paths.map(async (path) => {
      const entry = await readHistoryFile(path, AuditEntrySchema);
      if (
        !entry ||
        path !== historyPath(namespace, "audit", entry.scope.code, entry.id)
      ) {
        throw new Error(
          "CORRUPT_HISTORY: listed audit entry is missing or has a different identity",
        );
      }
      return entry;
    }),
  );
}

/** Writes a uniquely named audit record without overwriting a shared index or head. */
export async function saveAuditEntry(namespace: string, entry: AuditEntry) {
  const files = await getSharedFiles();
  await files.write(
    historyPath(namespace, "audit", entry.scope.code, entry.id),
    serializeHistory(entry),
  );
}
