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
  titleCaseSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

const MAX_DESCRIPTION_LENGTH = 255;
const MAX_LABEL_LENGTH = 100;
const MAX_KEY_LENGTH = 50;

/**
 * Regex for Commerce event names that must start with "plugin." or "observer."
 * followed by lowercase letters and underscores only.
 * Examples: "plugin.order_placed", "observer.catalog_update"
 */
const COMMERCE_EVENT_NAME_REGEX = /^(?:plugin|observer)\.[a-z_]+$/;

/**
 * Schema for Commerce event names.
 * Validates that the event name starts with "plugin." or "observer."
 * followed by lowercase letters and underscores only.
 */
function commerceEventNameSchema() {
  return v.pipe(
    nonEmptyStringValueSchema("event name"),
    v.regex(
      COMMERCE_EVENT_NAME_REGEX,
      'Event name must start with "plugin." or "observer." followed by lowercase letters and underscores only (e.g., "plugin.order_placed")',
    ),
  );
}

/** Schema for event provider configuration */
const ProviderSchema = v.object({
  label: v.pipe(
    titleCaseSchema("provider label"),
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

/** Schema for base shared properties between event types. */
const BaseEventSchema = v.object({
  label: v.pipe(
    titleCaseSchema("event label"),
    v.maxLength(
      MAX_LABEL_LENGTH,
      `The event label must not be longer than ${MAX_LABEL_LENGTH} characters`,
    ),
  ),

  description: v.pipe(
    nonEmptyStringValueSchema("event description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The event description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),
});

/** Schema for Commerce event configuration */
const CommerceEventSchema = v.object({
  ...BaseEventSchema.entries,

  name: commerceEventNameSchema(),
  fields: v.array(
    alphaNumericOrUnderscoreSchema("event fields", "lowercase"),
    "Expected an array of event fields",
  ),

  runtimeAction: nonEmptyStringValueSchema("runtime action"),
});

/** Schema for external event configuration */
const ExternalEventSchema = v.object({
  ...BaseEventSchema.entries,
  name: alphaNumericOrUnderscoreSchema("event name", "lowercase"),
});

/** Schema for Commerce event source configuration */
const CommerceEventSourceSchema = v.object({
  provider: ProviderSchema,
  events: v.array(CommerceEventSchema, "Expected an array of Commerce events"),
});

/** Schema for external event source configuration */
const ExternalEventSourceSchema = v.object({
  provider: ProviderSchema,
  events: v.array(ExternalEventSchema, "Expected an array of external events"),
});

/** Schema for eventing configuration with separate commerce and external arrays */
export const EventingSchema = v.object({
  commerce: v.optional(
    v.array(
      CommerceEventSourceSchema,
      "Expected an array of Commerce event sources",
    ),
  ),
  external: v.optional(
    v.array(
      ExternalEventSourceSchema,
      "Expected an array of external event sources",
    ),
  ),
});

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

/** Commerce event configuration */
export type CommerceEvent = v.InferInput<typeof CommerceEventSchema>;

/** External event configuration */
export type ExternalEvent = v.InferInput<typeof ExternalEventSchema>;

/** Event provider configuration */
export type EventProvider = v.InferInput<typeof ProviderSchema>;
