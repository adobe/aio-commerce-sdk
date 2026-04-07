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

import * as v from "valibot";

/**
 * Schema for the Admin UI SDK registration parameters.
 *
 * `extensionName` and `extensionTitle` are intentionally omitted here —
 * they are derived at installation time from `metadata.id` and
 * `metadata.displayName` respectively, which are already present in the
 * manifest.
 */
const AdminUiSdkRegistrationSchema = v.object({
  menuItems: v.array(
    v.object({
      id: v.string(),
      title: v.optional(v.string()),
      parent: v.optional(v.string()),
      sortOrder: v.optional(v.number()),
      sandbox: v.optional(v.string()),
      isSection: v.optional(v.boolean()),
    }),
  ),
});

/** Schema for Admin UI SDK configuration. */
export const AdminUiSdkSchema = v.object({
  registration: AdminUiSdkRegistrationSchema,
});

/** The Admin UI SDK configuration for an Adobe Commerce application. */
export type AdminUiSdkConfiguration = v.InferInput<typeof AdminUiSdkSchema>;
