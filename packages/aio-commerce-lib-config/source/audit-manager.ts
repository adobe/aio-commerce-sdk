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

import { queryAuditLog } from "#modules/audit/audit-logger";
import { DEFAULT_NAMESPACE } from "#utils/constants";

import type {
  GetAuditLogRequest,
  GetAuditLogResponse,
} from "#modules/audit/types";

/**
 * Reads business configuration changes, newest first, without changing live configuration.
 * Sensitive values are redacted; actor identity must be supplied by the writing application.
 *
 * @param filters - Optional scope, actor, date, and pagination filters.
 * @example
 * ```typescript
 * const { entries } = await getAuditLog({ scopeCode: "global", userId: "operator-123" });
 * ```
 */
export async function getAuditLog(
  filters: GetAuditLogRequest = {},
): Promise<GetAuditLogResponse> {
  return await queryAuditLog(DEFAULT_NAMESPACE, filters);
}
