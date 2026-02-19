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

/**
 * This module exports configuration management utilities for the AIO Commerce SDK.
 * @packageDocumentation
 */

export * from "./config-manager";
export {
  byCode,
  byCodeAndLevel,
  byScopeId,
  type SelectorBy,
  type SelectorByCode,
  type SelectorByCodeAndLevel,
  type SelectorByScopeId,
} from "./config-utils";
export { SchemaBusinessConfig } from "./modules/schema";
export * from "./types";
export { generateEncryptionKey } from "./utils/encryption";

export type { ConfigOrigin, ConfigValue } from "./modules/configuration";
export type {
  BusinessConfig,
  BusinessConfigSchema,
  BusinessConfigSchemaField,
  BusinessConfigSchemaListOption,
  BusinessConfigSchemaValue,
} from "./modules/schema";
export type { ScopeNode, ScopeTree } from "./modules/scope-tree";
