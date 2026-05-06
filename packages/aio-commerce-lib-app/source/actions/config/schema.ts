/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { SchemaBusinessConfig } from "@adobe/aio-commerce-lib-config";
import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

// Pulled from lib-config rather than re-declared.
export const BusinessConfigSchemaSchema = v.unwrap(
  SchemaBusinessConfig.entries.schema,
);

// Shared primitives used by multiple response schemas below.
const AcceptedConfigurationValuesSchema = v.union([
  v.boolean(),
  v.string(),
  v.array(v.string()),
]);

const BusinessConfigSchemaValueSchema = v.optional(
  AcceptedConfigurationValuesSchema,
);

const ScopeSchema = v.object({
  id: v.string(),
  code: v.string(),
  level: v.string(),
});

// ---------------------------------------------------------------------------
// GET / — retrieve configuration
// ---------------------------------------------------------------------------

const ConfigValueSchema = v.object({
  name: v.string(),
  value: BusinessConfigSchemaValueSchema,
  origin: v.object({ code: v.string(), level: v.string() }),
});

/** 200 response for GET / */
export const GetConfigurationResponseSchema = v.pipe(
  v.object({
    schema: BusinessConfigSchemaSchema,
    values: v.object({
      scope: ScopeSchema,
      config: v.array(ConfigValueSchema),
    }),
  }),
  v.metadata({
    description: "Current configuration values for the given scope",
  }),
);

// ---------------------------------------------------------------------------
// PUT / — set configuration (deprecated)
// ---------------------------------------------------------------------------

/** Request body for PUT / */
export const PutConfigBodySchema = v.object({
  scopeId: nonEmptyStringValueSchema("scopeId"),
  config: v.array(
    v.object({
      name: nonEmptyStringValueSchema("config[i].name"),
      value: v.union([v.string(), v.array(v.string())]),
    }),
  ),
});

const SetConfigItemSchema = v.object({
  name: v.string(),
  value: BusinessConfigSchemaValueSchema,
});

const SetConfigurationBaseSchema = v.object({
  message: v.string(),
  timestamp: v.string(),
  scope: ScopeSchema,
  config: v.array(SetConfigItemSchema),
});

/** 200 response for PUT / (deprecated) — also used by PATCH / */
export const SetConfigurationResponseSchema = v.pipe(
  SetConfigurationBaseSchema,
  v.metadata({
    deprecated: true,
    description: "Configuration values updated. Use PATCH instead.",
  }),
);

// ---------------------------------------------------------------------------
// PATCH / — partially update configuration
// ---------------------------------------------------------------------------

/** Request body for PATCH / */
export const PatchConfigBodySchema = v.object({
  scopeId: nonEmptyStringValueSchema("scopeId"),
  config: v.array(
    v.object({
      name: nonEmptyStringValueSchema("config[i].name"),
      // null unsets the field, restoring inheritance from the parent scope
      value: v.nullable(AcceptedConfigurationValuesSchema),
    }),
  ),
});

/** 200 response for PATCH / */
export const PatchConfigurationResponseSchema = v.pipe(
  SetConfigurationBaseSchema,
  v.metadata({
    description: "Configuration values updated for the given scope",
  }),
);
