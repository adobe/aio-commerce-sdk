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

// A plain `v.object` (not `strictObject`) so unknown keys stay ignored. The
// `:adopt` identifiers below are optional: an older Commerce App Management
// frontend won't send them, in which case the action skips adoption and
// ownership binds later on the first owner-gated write.
/**
 * Request body for POST / — store association data and, when the `:adopt`
 * identifiers are present, adopt the Commerce App Management Service record.
 */
export const AssociationRequestBodySchema = v.object({
  commerceBaseUrl: v.pipe(
    v.string(),
    v.url(
      "The 'commerceBaseUrl' field must be a valid absolute URL (e.g., 'https://my-store.example.com')",
    ),
  ),
  commerceEnv: CommerceEnvSchema,

  // Identifiers for the `:adopt` handshake with the Commerce App Management
  // Service, supplied by its frontend on association. Optional for backward
  // compatibility (see the note above); all three must be present to adopt.
  //
  // - `commerceId` / `workspaceId`: the record's natural-key parts that `:adopt`
  //   resolves by (together with the org derived from the caller's token).
  // - `extId`: the App Builder application id. Not a lookup key — the service
  //   asserts it matches the stored record's `extId` and rejects the adopt on a
  //   mismatch, so a different app cannot claim ownership of this record.
  commerceId: v.optional(nonEmptyStringValueSchema("commerceId")),
  extId: v.optional(nonEmptyStringValueSchema("extId")),
  workspaceId: v.optional(nonEmptyStringValueSchema("workspaceId")),
});
