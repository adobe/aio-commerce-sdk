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

import type { ConfigDiff } from "#modules/versioning/types";

/**
 * Actor information for audit logs.
 */
export type AuditActor = {
  /** User identifier */
  userId?: string;
  /** Source system or application */
  source?: string;
  /** IP address (if available) */
  ipAddress?: string;
  /** User agent (if available) */
  userAgent?: string;
};

/**
 * Audit log entry for a configuration change.
 */
export type AuditEntry = {
  /** Unique audit entry identifier */
  id: string;
  /** Timestamp of the change */
  timestamp: string;
  /** Scope that was changed */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** Version ID that was created */
  versionId: string;
  /** Actor who made the change */
  actor: AuditActor;
  /** Changes made (GDPR-compliant) */
  changes: ConfigDiff[];
  /** Integrity hash for chain verification */
  integrityHash: string;
  /** Previous audit entry hash (for chain) */
  previousHash: string | null;
  /** Action performed */
  action: "create" | "update" | "rollback";
};

/**
 * Request to create an audit log entry.
 */
export type CreateAuditEntryRequest = {
  /** Scope information */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** Version ID */
  versionId: string;
  /** Actor information */
  actor: AuditActor;
  /** Changes made */
  changes: ConfigDiff[];
  /** Action performed */
  action: "create" | "update" | "rollback";
};

/**
 * Request to query audit logs.
 */
export type GetAuditLogRequest = {
  /** Filter by scope code */
  scopeCode?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by action type */
  action?: "create" | "update" | "rollback";
  /** Start date for filtering */
  startDate?: string;
  /** End date for filtering */
  endDate?: string;
  /** Maximum number of entries to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
};

/**
 * Response containing audit log entries.
 */
export type GetAuditLogResponse = {
  /** Array of audit entries */
  entries: AuditEntry[];
  /** Pagination metadata */
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

/**
 * Context for audit operations.
 */
export type AuditContext = {
  /** Namespace for audit storage */
  namespace: string;
};
