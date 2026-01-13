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
  SchemaBusinessConfig,
  SchemaBusinessConfigSchema,
} from "./business-configuration";
import { EventingSchema } from "./eventing-configuration";
import { MetadataSchema } from "./metadata";

export const CommerceAppConfigSchemas = {
  metadata: MetadataSchema,
  businessConfig: SchemaBusinessConfig,
  "businessConfig.schema": SchemaBusinessConfigSchema,
  eventing: EventingSchema,
} as const;

/** Individual validatable domains of the commerce app config. */
export type CommerceAppConfigDomain = keyof typeof CommerceAppConfigSchemas;

/** The schema used to validate the commerce app config file. */
export const CommerceAppConfigSchema = v.object({
  metadata: MetadataSchema,
  businessConfig: v.optional(SchemaBusinessConfig),
  eventing: v.optional(EventingSchema),
});

/** The input shape of the commerce app config schema. */
export type CommerceAppConfig = v.InferInput<typeof CommerceAppConfigSchema>;

/** The output shape of the commerce app config schema. */
export type CommerceAppConfigOutputModel = v.InferOutput<
  typeof CommerceAppConfigSchema
>;
