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
  stringValueSchema,
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
 * Regex for field names according to XSD fieldName pattern.
 * Field name can either contain only [a-zA-Z0-9_\-\.\[\]] or be set to *.
 */
const FIELD_NAME_REGEX = /^([a-zA-Z0-9_\-.[\]]+|\*)$/;

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

/**
 * Schema for field names.
 * Validates that the field name matches the XSD fieldName pattern:
 * can either contain only [a-zA-Z0-9_\-\.\[\]] or be set to *.
 */
function fieldNameSchema() {
  return v.pipe(
    nonEmptyStringValueSchema("field name"),
    v.regex(
      FIELD_NAME_REGEX,
      'Field name must contain only letters (a-z, A-Z), numbers (0-9), underscores (_), dashes (-), dots (.), and square brackets ([, ]), or be exactly "*"',
    ),
  );
}

/**
 * Schema for field objects in Commerce events.
 * Each field has a required name and an optional source.
 */
function commerceEventFieldSchema() {
  return v.object({
    name: fieldNameSchema(),
    source: v.optional(stringValueSchema("field source")),
  });
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

  runtimeActions: v.array(
    v.pipe(
      nonEmptyStringValueSchema("runtime action"),
      v.regex(
        /^[a-z0-9-]+\/[a-z0-9-]+$/,
        'Runtime action must be in the format "<package>/<action>" (e.g., "my-package/my-action")',
      ),
    ),
    "Expected an array of runtime actions in the format <package>/<action>",
  ),
});

/**
 * Schema for rule operator values.
 * Valid operators for Commerce event filtering rules.
 */
const ruleOperatorSchema = v.union(
  [
    v.literal("greaterThan"),
    v.literal("lessThan"),
    v.literal("equal"),
    v.literal("regex"),
    v.literal("in"),
    v.literal("onChange"),
  ],
  'Operator must be one of: "greaterThan", "lessThan", "equal", "regex", "in", or "onChange"',
);

/** Schema for Commerce event rule configuration */
const CommerceEventRuleSchema = v.object({
  field: nonEmptyStringValueSchema("rule field"),
  operator: ruleOperatorSchema,
  value: nonEmptyStringValueSchema("rule value"),
});

/** Schema for Commerce event configuration */
const CommerceEventSchema = v.object({
  ...BaseEventSchema.entries,

  name: commerceEventNameSchema(),
  fields: v.array(
    commerceEventFieldSchema(),
    "Expected an array of event field objects with a 'name' property",
  ),
  rules: v.optional(
    v.array(
      CommerceEventRuleSchema,
      "Expected an array of event rules with field, operator, and value",
    ),
  ),
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

/** Union type of all supported event configurations */
export type AppEvent = CommerceEvent | ExternalEvent;

/** Event provider configuration */
export type EventProvider = v.InferInput<typeof ProviderSchema>;
