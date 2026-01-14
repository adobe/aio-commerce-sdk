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

const MAX_DESCRIPTION_LENGTH = 255;
const MAX_LABEL_LENGTH = 100;
const MAX_KEY_LENGTH = 50;

function nonEmptyString(fieldName: string) {
  return v.pipe(
    v.string(`Expected a string for the ${fieldName}`),
    v.nonEmpty(`The ${fieldName} must not be empty`),
  );
}

/** Schema for event provider configuration */
const ProviderSchema = v.object({
  label: v.pipe(
    nonEmptyString("provider label"),
    v.maxLength(
      MAX_LABEL_LENGTH,
      `The provider label must not be longer than ${MAX_LABEL_LENGTH} characters`,
    ),
  ),
  description: v.pipe(
    nonEmptyString("provider description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The provider description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),
  key: v.optional(
    v.pipe(
      nonEmptyString("provider key"),
      v.regex(
        /^[a-z0-9-]+$/,
        "The provider key must contain only lowercase alphanumeric characters and dashes",
      ),
      v.maxLength(
        MAX_KEY_LENGTH,
        `The provider key must not be longer than ${MAX_KEY_LENGTH} characters`,
      ),
    ),
  ),
  default: v.optional(v.boolean("Expected a boolean for the default flag")),
});

/** Schema for Commerce event configuration */
const CommerceEventSchema = v.object({
  name: v.pipe(
    nonEmptyString("event name"),
    v.regex(
      /^[a-z_][a-z0-9_]*$/,
      "The event name must contain only lowercase alphanumeric characters and underscores, and start with a letter or underscore",
    ),
  ),
  fields: v.union([
    v.literal("*"),
    v.array(
      v.pipe(
        nonEmptyString("event field"),
        v.regex(
          /^[a-z_][a-z0-9_]*$/,
          "The event field must contain only lowercase alphanumeric characters and underscores",
        ),
      ),
      "Expected an array of event fields",
    ),
  ]),
  runtimeAction: nonEmptyString("runtime action"),
  description: v.pipe(
    nonEmptyString("event description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The event description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),
});

/** Schema for external event configuration */
const ExternalEventSchema = v.object({
  name: v.pipe(
    nonEmptyString("event name"),
    v.regex(
      /^[a-z_][a-z0-9_]*$/,
      "The event name must contain only lowercase alphanumeric characters and underscores, and start with a letter or underscore",
    ),
  ),
});

/** Schema for Commerce event provider configuration */
export const CommerceProviderConfigSchema = v.object({
  provider: ProviderSchema,
  events: v.array(CommerceEventSchema, "Expected an array of Commerce events"),
});

/** Schema for external event provider configuration */
const ExternalProviderConfigSchema = v.object({
  provider: ProviderSchema,
  events: v.array(ExternalEventSchema, "Expected an array of external events"),
});

/** Schema for eventing configuration */
export const EventingSchema = v.object({
  commerce: v.optional(
    v.array(
      CommerceProviderConfigSchema,
      "Expected an array of Commerce provider configurations",
    ),
  ),
  external: v.optional(
    v.array(
      ExternalProviderConfigSchema,
      "Expected an array of external provider configurations",
    ),
  ),
});

/** The eventing configuration for an Adobe Commerce application */
export type EventingConfiguration = v.InferInput<typeof EventingSchema>;

/** Commerce event provider configuration */
export type CommerceProviderConfig = v.InferInput<
  typeof CommerceProviderConfigSchema
>;

/** External event provider configuration */
export type ExternalProviderConfig = v.InferInput<
  typeof ExternalProviderConfigSchema
>;

/** Commerce event configuration */
export type CommerceEvent = v.InferInput<typeof CommerceEventSchema>;

/** External event configuration */
export type ExternalEvent = v.InferInput<typeof ExternalEventSchema>;

/** Event provider configuration */
export type EventProvider = v.InferInput<typeof ProviderSchema>;
