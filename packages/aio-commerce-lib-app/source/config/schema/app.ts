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

/** biome-ignore-all lint/performance/noBarrelFile: We want to have all the schema exports in one file. */

import * as v from "valibot";

import { AdminUiSdkSchema } from "./admin-ui-sdk";
import { SchemaBusinessConfig } from "./business-configuration";
import { EventingSchema } from "./eventing";
import { InstallationSchema } from "./installation";
import { MetadataSchema } from "./metadata";
import { WebhooksSchema } from "./webhooks";

/**
 * Supported Adobe I/O Runtime kinds for generated actions.
 * Keep this in sync with the runtimes Adobe I/O Runtime exposes; the union
 * gives consumers autocomplete and prevents typos in `app.commerce.config.*`.
 */
export const RuntimeKindSchema = v.union([
  v.literal("nodejs:22"),
  v.literal("nodejs:24"),
]);

/** The Adobe I/O Runtime kind used for generated runtime actions. */
export type RuntimeKind = v.InferOutput<typeof RuntimeKindSchema>;

/** Default runtime applied to generated actions when the config omits one. */
export const DEFAULT_RUNTIME: RuntimeKind = "nodejs:22";

/** The schema used to validate the commerce app config file. */
export const CommerceAppConfigSchema = v.looseObject({
  // TEMP: use `looseObject` for testing purposes, remove when all subsections of the config schema are implemented
  metadata: MetadataSchema,
  runtime: v.optional(RuntimeKindSchema),
  businessConfig: v.optional(SchemaBusinessConfig),
  eventing: v.optional(EventingSchema),
  adminUiSdk: v.optional(AdminUiSdkSchema),
  installation: v.optional(InstallationSchema),
  webhooks: v.optional(WebhooksSchema),
});

/** The input shape of the commerce app config schema. */
export type CommerceAppConfig = v.InferInput<typeof CommerceAppConfigSchema>;

/** The output shape of the commerce app config schema. */
export type CommerceAppConfigOutputModel = v.InferOutput<
  typeof CommerceAppConfigSchema
>;
