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

import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

// Shared primitives used by multiple response schemas below.
const AcceptedConfigurationValuesSchema = v.union([
  v.boolean(),
  v.string(),
  v.array(v.string()),
]);

/** The set of valid Commerce environments a configuration field can be scoped to. */
const COMMERCE_ENVS = ["paas", "saas"] as const;
export type CommerceEnv = (typeof COMMERCE_ENVS)[number];

/** Query parameters for GET / */
export const GetConfigurationQuerySchema = v.object({
  scopeId: nonEmptyStringValueSchema("scopeId"),
  commerceEnv: v.optional(v.picklist(COMMERCE_ENVS)),
});

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
