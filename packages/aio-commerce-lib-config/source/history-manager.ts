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
  getAuditLog as queryAuditLog,
  verifyAuditChain as verifyChain,
} from "#modules/audit/audit-logger";
import {
  compareTwoVersions,
  getVersionComparison as compareVersion,
} from "#modules/versioning/version-comparison";
import { getVersionHistory } from "#modules/versioning/version-manager";
import { getVersion } from "#modules/versioning/version-repository";
import { DEFAULT_NAMESPACE } from "#utils/constants";

import type { GetAuditLogRequest } from "#modules/audit/types";
import type { GetVersionHistoryRequest } from "#modules/versioning/types";

function versionContext() {
  return { namespace: DEFAULT_NAMESPACE };
}

/**
 * Lists retained, redacted scope-local snapshots, newest first (default limit 25, maximum 1000).
 * Existing configuration is not backfilled; recording starts with the first write after upgrade.
 *
 * @param scopeCode - Scope code, not a scope ID or a Commerce numeric ID.
 * @param historyOptions - Limit and zero-based offset.
 */
export async function getConfigurationHistory(
  scopeCode: string,
  historyOptions: Omit<GetVersionHistoryRequest, "scopeCode"> = {},
) {
  return await getVersionHistory(versionContext(), {
    ...historyOptions,
    scopeCode,
  });
}

/**
 * Queries redacted audit records across all scopes or a single scope (default limit 50).
 * Actor data is application-supplied and may contain personal information.
 *
 * @param filters - Scope, actor, action, date range, and pagination filters.
 */
export async function getAuditLog(filters: GetAuditLogRequest = {}) {
  return await queryAuditLog({ namespace: DEFAULT_NAMESPACE }, filters);
}

/** Gets a retained, redacted version, or null if absent or removed by retention. */
export async function getVersionById(scopeCode: string, versionId: string) {
  return await getVersion(DEFAULT_NAMESPACE, scopeCode, versionId);
}

/** Gets a version's redacted before/after state and diff, or null if not retained. */
export async function getVersionComparison(
  scopeCode: string,
  versionId: string,
) {
  return await compareVersion(versionContext(), scopeCode, versionId);
}

/** Compares two retained, redacted snapshots; returns null if either is absent. */
export async function compareVersions(
  scopeCode: string,
  fromVersionId: string,
  toVersionId: string,
) {
  return await compareTwoVersions(
    versionContext(),
    scopeCode,
    fromVersionId,
    toVersionId,
  );
}

/**
 * Verifies hashes and links in one scope's audit chain, detecting disconnected records and forks.
 * Without an externally trusted head hash, deleting a suffix or rewriting the entire chain is undetectable.
 * This verifies audit records, not historical snapshot contents or actor identities.
 *
 * @param scopeCode - Scope code whose chain should be verified.
 * @param expectedHeadHash - Optional exact head hash previously stored outside this history store.
 */
export async function verifyAuditChain(
  scopeCode: string,
  expectedHeadHash?: string,
) {
  return await verifyChain(
    { namespace: DEFAULT_NAMESPACE },
    scopeCode,
    expectedHeadHash,
  );
}
