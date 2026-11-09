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

import type { ConfigValue, SetConfigValue } from "#modules/configuration/types";
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
  config: SetConfigValue[];
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

/** Fields added, updated, or removed by a configuration write. */
export type ConfigurationVersionChange = {
  /** Newly overridden field names. */
  added: string[];
  /** Changed field names. */
  updated: string[];
  /** Overrides removed to restore inheritance. */
  removed: string[];
};

/** A stored configuration value; password values are masked in history responses. */
export type ConfigurationVersionValue = Pick<ConfigValue, "name" | "value">;

/** Before and after values for a changed field. */
export type VersionChangeEntry = {
  /** Configuration field name. */
  name: string;
  /** Previous value; omitted for added fields. */
  before?: BusinessConfigSchemaValue;
  /** New value; omitted for removed fields. */
  after?: BusinessConfigSchemaValue;
};

/** Configuration version metadata and scope-local values. */
export type ConfigurationVersion = {
  /** Unique immutable version identifier. */
  id: string;
  /** ISO timestamp of the write. */
  timestamp: string;
  /** Scope whose explicit overrides were recorded. */
  scope: GetConfigurationResponse["scope"];
  /** Operation that created this version. */
  reason: "set" | "restore";
  /** Source version when created by a restore. */
  restoredFromVersionId?: string;
  /** Summary of changed field names. */
  change: ConfigurationVersionChange;
  /** Scope-local values, without inherited values or defaults. */
  config: ConfigurationVersionValue[];
  /** Changed fields with before and after values. */
  changes: VersionChangeEntry[];
};

/** Pagination for configuration history. */
export type GetConfigurationVersionsParams = {
  /** Page size, from 1 to 200. Defaults to 50. */
  limit?: number;
  /** Non-negative number of versions to skip. Defaults to 0. */
  offset?: number;
};

/** Configuration history, newest first. */
export type GetConfigurationVersionsResponse = {
  /** Selected scope. */
  scope: GetConfigurationResponse["scope"];
  /** Versions in the requested page. */
  versions: ConfigurationVersion[];
  /** Total version count and effective pagination. */
  pagination: Required<GetConfigurationVersionsParams> & { total: number };
};

/** Selects a historical change to reapply to the current scope. */
export type RestoreConfigurationVersionRequest = {
  /** Source version identifier. */
  versionId: string;
  /** Checks the latest recorded version before writing; not a distributed lock. */
  expectedLatestVersionId?: string;
  /** Fields to restore; defaults to the source version's changed fields. */
  fields?: string[];
};

/** Result of selectively restoring a configuration version. */
export type RestoreConfigurationVersionResponse = SetConfigurationResponse & {
  /** Version used as the restore source. */
  restoredFromVersionId: string;
  /** Overrides removed from the selected scope. */
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
