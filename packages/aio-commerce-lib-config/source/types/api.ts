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

import type {
  AcceptableConfigValue,
  ConfigValue,
} from "../modules/configuration";
import type { ConfigSchemaField } from "../modules/schema";

/**
 * Response type for getting the configuration schema.
 */
export type GetConfigSchemaResponse = {
  /** Array of configuration schema field definitions. */
  configSchema: ConfigSchemaField[];
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
    value: AcceptableConfigValue;
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
    value: AcceptableConfigValue;
  }>;
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
