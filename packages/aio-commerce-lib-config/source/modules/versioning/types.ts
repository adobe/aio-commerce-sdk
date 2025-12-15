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

import type { ConfigValue } from "#modules/configuration/types";

/**
 * Represents a change in configuration between versions.
 */
export type ConfigDiff = {
  /** Configuration field name */
  name: string;
  /** Previous value (undefined if added) */
  oldValue?: unknown;
  /** New value (undefined if removed) */
  newValue?: unknown;
  /** Type of change */
  type: "added" | "modified" | "removed";
};

/**
 * Configuration version snapshot.
 */
export type ConfigVersion = {
  /** Unique version identifier */
  id: string;
  /** Scope this version belongs to */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** Full configuration snapshot */
  snapshot: ConfigValue[];
  /** Changes from previous version */
  diff: ConfigDiff[];
  /** Timestamp when version was created */
  timestamp: string;
  /** Reference to previous version (null for first version) */
  previousVersionId: string | null;
  /** Version number (incremental) */
  versionNumber: number;
  /** Actor who made the change */
  actor?: {
    userId?: string;
    source?: string;
  };
};

/**
 * Version metadata for quick lookups.
 */
export type VersionMetadata = {
  /** Latest version ID */
  latestVersionId: string;
  /** Total number of versions */
  totalVersions: number;
  /** Last update timestamp */
  lastUpdated: string;
};

/**
 * Request to create a new version.
 */
export type CreateVersionRequest = {
  /** Scope identifier */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** New configuration values */
  newConfig: ConfigValue[];
  /** Previous configuration values */
  oldConfig: ConfigValue[];
  /** Actor information */
  actor?: {
    userId?: string;
    source?: string;
  };
};

/**
 * Response from version creation.
 */
export type CreateVersionResponse = {
  /** Created version information */
  version: ConfigVersion;
  /** Version metadata */
  metadata: VersionMetadata;
};

/**
 * Request to get version history.
 */
export type GetVersionHistoryRequest = {
  /** Scope code */
  scopeCode: string;
  /** Maximum number of versions to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
};

/**
 * Response containing version history.
 */
export type GetVersionHistoryResponse = {
  /** Array of versions */
  versions: ConfigVersion[];
  /** Pagination metadata */
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

/**
 * Context for version operations.
 */
export type VersionContext = {
  /** Namespace for version storage */
  namespace: string;
  /** Maximum versions to keep per scope */
  maxVersions: number;
};

/**
 * Before/after comparison for a single version.
 */
export type VersionComparison = {
  /** The version being compared */
  version: ConfigVersion;
  /** Configuration state before this version */
  before: ConfigValue[];
  /** Configuration state after this version (same as version.snapshot) */
  after: ConfigValue[];
  /** Changes made in this version */
  changes: ConfigDiff[];
};

/**
 * Side-by-side comparison of two versions.
 */
export type TwoVersionComparison = {
  /** Earlier version */
  fromVersion: ConfigVersion;
  /** Later version */
  toVersion: ConfigVersion;
  /** Configuration at fromVersion */
  fromConfig: ConfigValue[];
  /** Configuration at toVersion */
  toConfig: ConfigValue[];
  /** All changes between versions */
  changes: ConfigDiff[];
};
