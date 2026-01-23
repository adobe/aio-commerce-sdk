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
  alphaOrUnderscoreSchema,
  nonEmptyStringValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

const MAX_DESCRIPTION_LENGTH = 255;
const MAX_LABEL_LENGTH = 100;
const MAX_KEY_LENGTH = 50;

/** Regex for Commerce event names that must start with "plugin." or "observer." */
const COMMERCE_EVENT_PREFIX_REGEX = /^(?:plugin|observer)\.[a-z_]+$/;

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
  name: v.pipe(
    alphaOrUnderscoreSchema("event name", "lowercase"),
    v.regex(
      COMMERCE_EVENT_PREFIX_REGEX,
      'Event name must be prefixed with "plugin." or "observer."',
    ),
  ),
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

/** Schema for Commerce event source configuration */
const CommerceEventSourceSchema = v.object({
  type: v.literal("commerce"),
  provider: ProviderSchema,
  events: v.array(CommerceEventSchema, "Expected an array of Commerce events"),
});

/** Schema for external event source configuration */
const ExternalEventSourceSchema = v.object({
  type: v.literal("external"),
  provider: ProviderSchema,
  events: v.array(ExternalEventSchema, "Expected an array of external events"),
});

/** Schema for event source - discriminated union by type */
const EventSourceSchema = v.variant("type", [
  CommerceEventSourceSchema,
  ExternalEventSourceSchema,
]);

/** Schema for eventing configuration - an array of event sources */
export const EventingSchema = v.pipe(
  v.array(EventSourceSchema, "Expected an array of event sources"),
  v.minLength(1, "At least one event source must be defined"),
);

/** The eventing configuration for an Adobe Commerce application */
export type EventingConfiguration = v.InferInput<typeof EventingSchema>;

/** Commerce event source configuration */
export type CommerceEventSource = v.InferInput<
  typeof CommerceEventSourceSchema
>;

/** External event source configuration */
export type ExternalEventSource = v.InferInput<
  typeof ExternalEventSourceSchema
>;

/** Event source configuration (discriminated union) */
export type EventSource = v.InferInput<typeof EventSourceSchema>;

/** Commerce event configuration */
export type CommerceEvent = v.InferInput<typeof CommerceEventSchema>;

/** External event configuration */
export type ExternalEvent = v.InferInput<typeof ExternalEventSchema>;

/** Event provider configuration */
export type EventProvider = v.InferInput<typeof ProviderSchema>;
