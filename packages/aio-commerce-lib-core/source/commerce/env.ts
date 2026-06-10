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

/** The list of supported Commerce environments an item can be scoped to. */
export const COMMERCE_ENVS = ["paas", "saas"] as const;

/** A single Commerce environment an item can be scoped to. */
export type CommerceEnv = (typeof COMMERCE_ENVS)[number];

/** Schema for a single Commerce environment an item can be scoped to. */
export const CommerceEnvSchema = v.picklist(
  COMMERCE_ENVS,
  `Expected one of: ${COMMERCE_ENVS.map((e) => `"${e}"`).join(", ")}`,
);

/**
 * Schema for a non-empty array of Commerce environments, used to scope an item
 * (a configuration field, webhook, or event) to specific environments.
 *
 * Apply the optional wrapper at the call site (`v.optional(CommerceEnvArraySchema)`);
 * when omitted, the item applies to all environments.
 */
export const CommerceEnvArraySchema = v.pipe(
  v.array(
    CommerceEnvSchema,
    'Expected an array of commerce environments for the field "env"',
  ),
  v.nonEmpty('The "env" array must contain at least one commerce environment'),
);
