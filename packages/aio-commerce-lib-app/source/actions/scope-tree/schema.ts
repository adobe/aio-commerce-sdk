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

// ---------------------------------------------------------------------------
// Shared primitives — recursive scope node schemas used across multiple endpoints
// ---------------------------------------------------------------------------

/** Mirrors `ScopeNode` from `@adobe/aio-commerce-lib-config`. */
export const ScopeNodeSchema: v.GenericSchema = v.pipe(
  v.object({
    id: v.string(),
    code: v.string(),
    label: v.string(),
    level: v.string(),
    is_editable: v.boolean(),
    is_final: v.boolean(),
    is_removable: v.boolean(),
    commerce_id: v.optional(v.number()),
    children: v.optional(v.array(v.lazy(() => ScopeNodeSchema))),
  }),
  v.title("ScopeNode"),
);

/** Mirrors `CustomScopeOutput` from `@adobe/aio-commerce-lib-config`. */
export const CustomScopeOutputSchema: v.GenericSchema = v.pipe(
  v.object({
    id: v.string(),
    code: v.string(),
    label: v.string(),
    level: v.string(),
    is_editable: v.boolean(),
    is_final: v.boolean(),
    children: v.optional(v.array(v.lazy(() => CustomScopeOutputSchema))),
  }),
  v.title("CustomScopeOutput"),
);

// ---------------------------------------------------------------------------
// GET / — get scope tree
// ---------------------------------------------------------------------------

/** 200 response for GET / */
export const ScopeTreeResponseSchema = v.object({
  scopes: v.array(ScopeNodeSchema),
});

/** 203 response for GET / (cached) */
export const CachedScopeTreeResponseSchema = v.pipe(
  v.object({ scopes: v.array(ScopeNodeSchema) }),
  v.metadata({ description: "Cached scope tree" }),
);

// ---------------------------------------------------------------------------
// PUT / — set custom scope tree
// ---------------------------------------------------------------------------

/** Request body for PUT / */
export const SetCustomScopeTreeBodySchema = v.object({
  scopes: v.array(v.any()),
});

/** 200 response for PUT / */
export const SetCustomScopeTreeResponseSchema = v.object({
  result: v.object({
    message: v.string(),
    timestamp: v.string(),
    scopes: v.array(CustomScopeOutputSchema),
  }),
});

// ---------------------------------------------------------------------------
// POST /commerce — sync commerce scopes
// ---------------------------------------------------------------------------

/** Request body for POST /commerce */
export const SyncCommerceScopesBodySchema = v.object({
  commerceBaseUrl: nonEmptyStringValueSchema("commerceBaseUrl"),
  commerceEnv: v.optional(nonEmptyStringValueSchema("commerceEnv")),
});

/** 200 response for POST /commerce */
export const SyncedScopeTreeResponseSchema = v.object({
  scopes: v.array(ScopeNodeSchema),
  synced: v.boolean(),
});

/** 203 response for POST /commerce (cached) */
export const CachedSyncedScopeTreeResponseSchema = v.pipe(
  v.object({ scopes: v.array(ScopeNodeSchema), synced: v.boolean() }),
  v.metadata({ description: "Cached scope tree" }),
);

// ---------------------------------------------------------------------------
// DELETE /commerce — unsync commerce scopes
// ---------------------------------------------------------------------------

/** 200 response for DELETE /commerce */
export const UnsyncScopeTreeResponseSchema = v.object({
  message: v.string(),
});
