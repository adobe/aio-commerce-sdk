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
import type {
  BusinessConfigSchema,
  BusinessConfigSchemaValue,
} from "#modules/schema/types";

export type { GetScopeTreeResult } from "#modules/scope-tree/types";

/**
 * Response type for getting the configuration schema.
 */
export type GetConfigSchemaResponse = {
  /** Array of configuration schema field definitions. */
  configSchema: BusinessConfigSchema;
};

/**
 * Response type for getting configuration for a scope.
 */
export type GetConfigurationResponse = {
  /** Scope information including id, code, and level. */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** Array of configuration values with their origins. */
  config: ConfigValue[];
};

/**
 * Response type for getting a single configuration value by key.
 */
export type GetConfigurationByKeyResponse = {
  /** Scope information including id, code, and level. */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** The configuration value, or null if not found. */
  config: ConfigValue | null;
};

/**
 * Request type for setting configuration values.
 */
export type SetConfigurationRequest = {
  /** Array of configuration name-value pairs to set. */
  config: Array<{
    /** The name of the configuration field. */
    name: string;
    /** The value to set (string, number, or boolean). */
    value: BusinessConfigSchemaValue;
  }>;
};

/**
 * Response type for setting configuration values.
 */
export type SetConfigurationResponse = {
  /** Success message. */
  message: string;
  /** ISO timestamp of when the configuration was updated. */
  timestamp: string;
  /** Scope information including id, code, and level. */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** Array of updated configuration values. */
  config: Array<{
    name: string;
    value: BusinessConfigSchemaValue;
  }>;
};

/**
 * Change summary between two configuration versions.
 */
export type ConfigurationVersionChange = {
  /** Config keys that were added in this version. */
  added: string[];
  /** Config keys that were updated in this version. */
  updated: string[];
  /** Config keys that were removed in this version. */
  removed: string[];
};

/** Config snapshot entry stored per version. */
export type ConfigurationVersionValue = {
  /** Config field name. */
  name: string;
  /** Config field value for this version. */
  value: BusinessConfigSchemaValue;
};

/**
 * Single key change with before/after values (only changed keys).
 * Added: after only; removed: before only; updated: both.
 */
export type VersionChangeEntry = {
  /** Config field name. */
  name: string;
  /** Value before this version (omitted for added keys). */
  before?: BusinessConfigSchemaValue;
  /** Value after this version (omitted for removed keys). */
  after?: BusinessConfigSchemaValue;
};

/**
 * Configuration version metadata.
 */
export type ConfigurationVersion = {
  /** Unique version identifier. */
  id: string;
  /** ISO timestamp for when this version was created. */
  timestamp: string;
  /** Scope information for this version. */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** Why this version was created. */
  reason: "set" | "restore";
  /** Source version ID if created by restore. */
  restoredFromVersionId?: string;
  /** Added/updated/removed key summary for this version. */
  change: ConfigurationVersionChange;
  /** Snapshot values for this version (name/value only). */
  config?: ConfigurationVersionValue[];
  /** Only changed keys with before/after values. */
  changes?: VersionChangeEntry[];
};

/**
 * Request query params for listing configuration versions.
 */
export type GetConfigurationVersionsParams = {
  /** Number of items to return. Defaults to 50. */
  limit?: number;
  /** Number of items to skip. Defaults to 0. */
  offset?: number;
};

/**
 * Response type for listing configuration versions.
 */
export type GetConfigurationVersionsResponse = {
  /** Scope information including id, code, and level. */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** Version metadata in descending order (newest first). */
  versions: ConfigurationVersion[];
  /** Pagination metadata for the current query. */
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

/**
 * Request type for restoring a configuration version.
 */
export type RestoreConfigurationVersionRequest = {
  /** Source version identifier to restore from. */
  versionId: string;
  /** Optional optimistic concurrency control against latest version id. */
  expectedLatestVersionId?: string;
  /** Optional subset of fields to restore; defaults to changed keys only. */
  fields?: string[];
};

/**
 * Response type for restoring a configuration version.
 */
export type RestoreConfigurationVersionResponse = {
  /** Success message. */
  message: string;
  /** ISO timestamp of when restore was applied. */
  timestamp: string;
  /** Scope information including id, code, and level. */
  scope: {
    id: string;
    code: string;
    level: string;
  };
  /** The version id that was used as restore source. */
  restoredFromVersionId: string;
  /** Restored values (name/value only). */
  config: Array<{
    name: string;
    value: BusinessConfigSchemaValue;
  }>;
  /** Restored keys removed from current scope. */
  removed: string[];
};

/**
 * Request type for setting custom scope tree.
 */
export type SetCustomScopeTreeRequest = {
  /** Array of custom scope definitions to set. */
  scopes: CustomScopeInput[];
};

/**
 * Input type for a custom scope definition.
 */
export type CustomScopeInput = {
  /** Optional scope ID. If not provided, a new scope will be created. */
  id?: string;
  /** Unique code identifier for the scope. */
  code: string;
  /** Human-readable label for the scope. */
  label: string;
  /** Optional level. Defaults to base level if not provided. */
  level?: string;
  /** Whether the scope configuration can be edited. */
  is_editable: boolean;
  /** Whether this is a final (leaf) scope that cannot have children. */
  is_final: boolean;
  /** Optional child scopes for hierarchical structures. */
  children?: CustomScopeInput[];
};

/**
 * Response type for setting custom scope tree.
 */
export type SetCustomScopeTreeResponse = {
  /** Success message. */
  message: string;
  /** ISO timestamp of when the custom scope tree was updated. */
  timestamp: string;
  /** Array of created/updated custom scopes with assigned IDs. */
  scopes: CustomScopeOutput[];
};

/**
 * Output type for a custom scope definition (includes assigned ID).
 */
export type CustomScopeOutput = {
  /** Assigned scope ID. */
  id: string;
  /** Unique code identifier for the scope. */
  code: string;
  /** Human-readable label for the scope. */
  label: string;
  /** Scope level. */
  level: string;
  /** Whether the scope configuration can be edited. */
  is_editable: boolean;
  /** Whether this is a final (leaf) scope that cannot have children. */
  is_final: boolean;
  /** Optional child scopes for hierarchical structures. */
  children?: CustomScopeOutput[];
};
