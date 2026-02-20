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

import type { SetRequiredDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "./app";

// biome-ignore lint/performance/noBarrelFile: The business config schema lives in a separate package.
export { SchemaBusinessConfig } from "@adobe/aio-commerce-lib-config";

/** Config type when business config is present. */
export type AppConfigWithBusinessConfig = CommerceAppConfigOutputModel & {
  businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
};

/** Config type when business config schema is present. */
export type AppConfigWithBusinessConfigSchema = SetRequiredDeep<
  AppConfigWithBusinessConfig,
  "businessConfig.schema"
>;

/**
 * Check if config has business config.
 * @param config - The configuration to check.
 */
export function hasBusinessConfig(
  config: CommerceAppConfigOutputModel,
): config is AppConfigWithBusinessConfig {
  return config.businessConfig !== undefined;
}

/**
 * Check if config has business config schema.
 * @param config - The configuration to check.
 */
export function hasBusinessConfigSchema(
  config: CommerceAppConfigOutputModel,
): config is AppConfigWithBusinessConfigSchema {
  return (
    config.businessConfig?.schema !== undefined &&
    config.businessConfig.schema.length > 0
  );
}
