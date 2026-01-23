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

import type { SetOptional } from "type-fest";
import type { BusinessConfigSchemaValue } from "#modules/schema/types";

/**
 * Represents the origin of a configuration value, indicating which scope it came from.
 */
export type ConfigOrigin = {
  /** The scope code where the configuration value originates. */
  code: string;
  /** The scope level where the configuration value originates. */
  level: string;
};

/**
 * Represents a configuration value with its origin information.
 */
export type ConfigValue = {
  /** The name of the configuration field. */
  name: string;
  /** The configuration value (string, number, boolean, or undefined). */
  value: BusinessConfigSchemaValue;
  /** The origin scope where this value was set or inherited from. */
  origin: ConfigOrigin;
};

/**
 * Configuration value with optional origin information.
 *
 * Used internally when setting configuration values where the origin
 * will be determined automatically.
 *
 * @internal
 */
export type ConfigValueWithOptionalOrigin = SetOptional<ConfigValue, "origin">;

/**
 * Context needed for configuration operations.
 */
export type ConfigContext = {
  /** The namespace for isolating configuration data. */
  namespace: string;
  /** Cache timeout in milliseconds. */
  cacheTimeout: number;
};
