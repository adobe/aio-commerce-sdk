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
  auditPath,
  auditPrefix,
  listAuditPaths,
  readAuditFile,
  serializeAudit,
} from "#utils/audit-storage";
import { getSharedFiles } from "#utils/repository";

import type { AuditEntry } from "./types";

/** Reads validated records; missing or corrupt listed records reject the query. */
export async function listAuditEntries(
  namespace: string,
): Promise<AuditEntry[]> {
  const paths = await listAuditPaths(auditPrefix(namespace));
  return Promise.all(
    paths.map(async (path) => {
      const entry = await readAuditFile(path);
      if (path !== auditPath(namespace, entry.id)) {
        throw new Error("CORRUPT_AUDIT: record identity mismatch");
      }
      return entry;
    }),
  );
}

/** Appends a uniquely named record without a shared mutable index. */
export async function saveAuditEntry(namespace: string, entry: AuditEntry) {
  const files = await getSharedFiles();
  await files.write(auditPath(namespace, entry.id), serializeAudit(entry));
}
