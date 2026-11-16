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
  deriveScopeFromArgs,
  deriveScopeFromCodeWithOptionalLevel,
} from "#config-utils";
import { queryAuditLog } from "#modules/audit/audit-logger";
import { getPersistedScopeTree } from "#modules/scope-tree/scope-tree-repository";
import { DEFAULT_NAMESPACE } from "#utils/constants";

import type { SelectorBy } from "#config-utils";
import type {
  GetAuditLogRequest,
  GetAuditLogResponse,
} from "#modules/audit/types";

async function resolveScopeId(selector: SelectorBy) {
  const tree = await getPersistedScopeTree(DEFAULT_NAMESPACE);
  const { by } = selector;
  if (by._tag === "scopeId") {
    return deriveScopeFromArgs([by.scopeId], tree).scopeId;
  }
  if (by._tag === "codeAndLevel") {
    return deriveScopeFromArgs([by.code, by.level], tree).scopeId;
  }
  if (by._tag === "commerceScopeId") {
    return deriveScopeFromArgs([by.commerceScopeId, by.level], tree).scopeId;
  }
  return deriveScopeFromCodeWithOptionalLevel(by.code, undefined, tree).scopeId;
}

/**
 * Reads business configuration changes, newest first, without changing live configuration.
 * Sensitive values are redacted; actor identity must be supplied by the writing application.
 *
 * @param selector - Optional scope selector; omit to query all scopes.
 * @param filters - Optional actor, date, and pagination filters.
 * @example
 * ```typescript
 * const { entries } = await getAuditLog(byScopeId("id-global"), { userId: "operator-123" });
 * ```
 */
export async function getAuditLog(
  selector?: SelectorBy,
  filters: GetAuditLogRequest = {},
): Promise<GetAuditLogResponse> {
  const scopeId =
    selector === undefined ? undefined : await resolveScopeId(selector);
  return await queryAuditLog(DEFAULT_NAMESPACE, filters, scopeId);
}
