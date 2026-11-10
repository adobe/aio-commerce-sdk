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

import type { ConfigOrigin, ConfigValue } from "#modules/configuration/types";

/** Application-supplied attribution, not an authenticated identity assertion. */
export type AuditActor = {
  /** Stable user identifier supplied by the application's authenticated context. */
  userId?: string;
  /** Application or system responsible for the change. */
  source?: string;
};

/** A scope-local configuration change, with sensitive values redacted. */
export type ConfigDiff = {
  /** Configuration field name. */
  name: string;
  /** Previous value, absent for added fields. */
  oldValue?: ConfigValue["value"];
  /** New value, absent for removed fields. */
  newValue?: ConfigValue["value"];
  /** Origin before the change, absent for added fields. */
  oldOrigin?: ConfigOrigin;
  /** Origin after the change, absent for removed fields. */
  newOrigin?: ConfigOrigin;
  /** Whether the local override was added, modified, or removed. */
  type: "added" | "modified" | "removed";
};

/** Read-only record of a business configuration change. */
export type AuditEntry = {
  /** Unique record identifier. */
  id: string;
  /** ISO timestamp of the change. */
  timestamp: string;
  /** Scope whose local overrides changed. */
  scope: { id: string; code: string; level: string };
  /** Supplied attribution; empty when the application did not provide it. */
  actor: AuditActor;
  /** Changed fields only; no configuration snapshot or historical credentials. */
  changes: ConfigDiff[];
};

/** Filters for querying business configuration audit records. */
export type GetAuditLogRequest = {
  /** Scope code, compared case-insensitively; omit to query all scopes. */
  scopeCode?: string;
  /** Exact actor identifier. */
  userId?: string;
  /** Inclusive lower timestamp bound. */
  startDate?: string;
  /** Inclusive upper timestamp bound. */
  endDate?: string;
  /** Maximum records to return, from 1 to 1000; defaults to 50. */
  limit?: number;
  /** Zero-based record offset; defaults to 0. */
  offset?: number;
};

/** Audit records ordered newest first, with pagination metadata. */
export type GetAuditLogResponse = {
  /** Matching records in the requested page. */
  entries: AuditEntry[];
  /** Pagination over matching records, not storage-level pagination. */
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};
