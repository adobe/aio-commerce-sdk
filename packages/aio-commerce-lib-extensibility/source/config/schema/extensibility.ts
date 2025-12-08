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

import {
  BusinessConfigSchema,
  BusinessConfigSchemaSchema,
} from "./business-configuration";
import { MetadataSchema } from "./metadata";

export const ExtensibilityConfigSchemas = {
  metadata: MetadataSchema,
  businessConfig: BusinessConfigSchema,
  "businessConfig.schema": BusinessConfigSchemaSchema,
} as const;

/** Individual validatable domains of the extensibility config. */
export type ExtensibilityConfigDomain = keyof typeof ExtensibilityConfigSchemas;

/** The schema used to validate the extensibility config file. */
export const ExtensibilityConfigSchema = v.object({
  metadata: v.optional(MetadataSchema),
  businessConfig: v.optional(BusinessConfigSchema),
});

/** The input shape of the extensibility config schema. */
export type ExtensibilityConfig = v.InferInput<
  typeof ExtensibilityConfigSchema
>;

/** The output shape of the extensibility config schema. */
export type ExtensibilityConfigOutputModel = v.InferOutput<
  typeof ExtensibilityConfigSchema
>;
