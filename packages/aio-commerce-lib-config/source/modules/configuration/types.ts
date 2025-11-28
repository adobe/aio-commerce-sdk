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
import type { BusinessConfigSchema } from "#modules/schema/schema";

// Configuration-specific types
export type ConfigOrigin = {
  code: string;
  level: string;
};

export type AcceptableConfigValue = BusinessConfigSchema[number]["default"];

export type ConfigValue = {
  name: string;
  value: AcceptableConfigValue;
  origin: ConfigOrigin;
};

export type ConfigValueWithOptionalOrigin = SetOptional<ConfigValue, "origin">;

// Context needed for configuration operations
export type ConfigContext = {
  namespace: string;
  cacheTimeout: number;
};
