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

import {
  alphaNumericOrHyphenSchema,
  alphaNumericOrUnderscoreSchema,
  nonEmptyStringValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

const MAX_DESCRIPTION_LENGTH = 255;
const MAX_LABEL_LENGTH = 100;
const MAX_KEY_LENGTH = 50;

/** Schema for event provider configuration */
const ProviderSchema = v.object({
  label: v.pipe(
    nonEmptyStringValueSchema("provider label"),
    v.maxLength(
      MAX_LABEL_LENGTH,
      `The provider label must not be longer than ${MAX_LABEL_LENGTH} characters`,
    ),
  ),
  description: v.pipe(
    nonEmptyStringValueSchema("provider description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The provider description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),
  key: v.optional(
    v.pipe(
      alphaNumericOrHyphenSchema("provider key"),
      v.maxLength(
        MAX_KEY_LENGTH,
        `The provider key must not be longer than ${MAX_KEY_LENGTH} characters`,
      ),
    ),
  ),
});

/** Schema for Commerce event configuration */
const CommerceEventSchema = v.object({
  name: alphaNumericOrUnderscoreSchema("event name", "lowercase"),
  fields: v.array(
    alphaNumericOrUnderscoreSchema("event fields", "lowercase"),
    "Expected an array of event fields",
  ),
  runtimeAction: nonEmptyStringValueSchema("runtime action"),
  description: v.pipe(
    nonEmptyStringValueSchema("event description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The event description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),
});

/** Schema for external event configuration */
const ExternalEventSchema = v.object({
  name: alphaNumericOrUnderscoreSchema("event name", "lowercase"),
});

/** Schema for Commerce event provider configuration */
const CommerceProviderConfigSchema = v.object({
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
