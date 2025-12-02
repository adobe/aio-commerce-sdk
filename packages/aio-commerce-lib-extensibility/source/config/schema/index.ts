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

/** biome-ignore-all lint/style/noExportedImports: We are doing both, importing to use and re-exporting it. */
/** biome-ignore-all lint/performance/noBarrelFile: We want to have all the schema exports in one file. */

import * as v from "valibot";

import { BusinessConfigurationSchema } from "./business-configuration";

import type { BusinessConfigurationConfig } from "./business-configuration";

/** The schema used to validate an extensibility config domain. */
export const extensibilityConfigDomainsSchema = v.picklist(
  ["businessConfig"],
  "Expected a valid extensibility config domain",
);

/** The different extensibility domains of Adobe Commerce apps. */
export type ExtensibilityConfigDomain = v.InferOutput<
  typeof extensibilityConfigDomainsSchema
>;

/** The schema used to validate the extensibility config file. */
export const ExtensibilityConfigSchema = v.object({
  businessConfig: v.optional(BusinessConfigurationSchema),
});

/** The input shape of the extensibility config schema. */
export type ExtensibilityConfig = v.InferInput<
  typeof ExtensibilityConfigSchema
>;

/** The output shape of the extensibility config schema. */
export type ExtensibilityConfigOutputModel = v.InferOutput<
  typeof ExtensibilityConfigSchema
>;

export { type BusinessConfigurationConfig, BusinessConfigurationSchema };
