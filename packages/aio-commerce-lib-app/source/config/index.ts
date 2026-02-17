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

/** biome-ignore-all lint/performance/noBarrelFile: This is the public API for the config entrypoint */

/**
 * This module exports shared config utilities for the AIO Commerce SDK.
 * @packageDocumentation
 */

export { defineConfig } from "./lib/define";
export {
  parseCommerceAppConfig,
  readCommerceAppConfig,
  resolveCommerceAppConfig,
} from "./lib/parser";
export {
  validateCommerceAppConfig,
  validateCommerceAppConfigDomain,
} from "./lib/validate";
export {
  hasBusinessConfig,
  hasBusinessConfigSchema,
} from "./schema/business-configuration";
export {
  CommerceAppConfigSchemas,
  getConfigDomains,
  hasConfigDomain,
} from "./schema/domains";
export {
  hasCommerceEvents,
  hasEventing,
  hasExternalEvents,
} from "./schema/eventing";
export {
  hasCustomInstallation,
  hasCustomInstallationSteps,
} from "./schema/installation";
export { hasMetadata } from "./schema/metadata";

export type { CommerceAppConfig } from "./schema/app";
export type {
  AppConfigWithBusinessConfig,
  AppConfigWithBusinessConfigSchema,
  BusinessConfig,
  BusinessConfigSchema,
  BusinessConfigSchemaField,
  BusinessConfigSchemaListOption,
  BusinessConfigSchemaValue,
  SchemaBusinessConfig,
} from "./schema/business-configuration";
export type { CommerceAppConfigDomain } from "./schema/domains";
export type * from "./schema/eventing";
export type { ApplicationMetadata } from "./schema/metadata";
