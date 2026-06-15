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

import { CommerceEnvSchema } from "@adobe/aio-commerce-lib-core/commerce";
import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { CustomScopeInput } from "@adobe/aio-commerce-lib-config";

const CustomScopeInputSchema: v.GenericSchema<CustomScopeInput> = v.object({
  id: v.optional(v.string()),
  code: v.string(),
  label: v.string(),
  level: v.optional(v.string()),
  is_editable: v.boolean(),
  is_final: v.boolean(),
  children: v.optional(v.array(v.lazy(() => CustomScopeInputSchema))),
});

/** Request body for PUT / */
export const SetCustomScopeTreeBodySchema = v.object({
  scopes: v.array(CustomScopeInputSchema),
});

/** Request body for POST /commerce */
export const SyncCommerceScopesBodySchema = v.object({
  commerceBaseUrl: nonEmptyStringValueSchema("commerceBaseUrl"),
  commerceEnv: v.optional(CommerceEnvSchema),
});
