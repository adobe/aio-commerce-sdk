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

import { CommerceEnvArraySchema } from "@adobe/aio-commerce-lib-core/commerce";
import {
  alphaNumericOrHyphenSchema,
  booleanValueSchema,
  nonEmptyStringValueSchema,
  stringValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { AnyCommerceAppConfig, CommerceAppConfigOutputModel } from "./app";

const MAX_DESCRIPTION_LENGTH = 255;
const MAX_LABEL_LENGTH = 100;
const MAX_KEY_LENGTH = 50;
const MAX_EVENT_NAME_LENGTH = 180;

/**
 * Regex for Commerce event names that must start with "plugin." or "observer."
 * followed by one or more dot-separated lowercase segments containing letters
 * and underscores only.
 * Examples: "observer.order_placed", "plugin.sales.api.order_management.place"
 */
const COMMERCE_EVENT_NAME_REGEX =
  /^(?:plugin|observer)\.[a-z_]+(?:\.[a-z_]+)*$/;

/**
 * Regex for external event names.
 * Allows word characters (letters, digits, underscore), hyphens, underscores, and dots.
 * Examples: "external_event", "webhook.received", "my-event_123"
 */
const EXTERNAL_EVENT_NAME_REGEX = /^[\w\-_.]+$/;

/**
 * Regex for field names according to XSD fieldName pattern.
 * Field name can either contain only [a-zA-Z0-9_\-\.\[\]] or be set to *.
 */
const FIELD_NAME_REGEX = /^([a-zA-Z0-9_\-.[\]]+|\*)$/;

/**
 * Regex for Adobe I/O Events API text fields (label, description).
 * Valid characters per API: letters, numbers, spaces, underscores, hyphens,
 * dots, colons, parentheses, commas, @, and /.
 */
const IO_EVENTS_TEXT_REGEX = /^[a-zA-Z0-9 _.:()\-,@/]+$/;

/**
 * Schema for Commerce event names.
 * Validates that the event name starts with "plugin." or "observer."
 * followed by one or more dot-separated lowercase segments containing letters
 * and underscores only.
 */
function commerceEventNameSchema() {
  return v.pipe(
    nonEmptyStringValueSchema("event name"),
    v.regex(
      COMMERCE_EVENT_NAME_REGEX,
      'Event name must start with "plugin." or "observer." followed by one or more dot-separated lowercase segments containing letters and underscores only (e.g., "observer.order_placed", "plugin.sales.api.order_management.place")',
    ),
    v.maxLength(
      MAX_EVENT_NAME_LENGTH,
      `The event name must not be longer than ${MAX_EVENT_NAME_LENGTH} characters`,
    ),
  );
}

/**
 * Schema for external event names.
 * Validates that the event name contains only word characters (letters, digits, underscore),
 * hyphens, underscores, and dots.
 */
function externalEventNameSchema() {
  return v.pipe(
    nonEmptyStringValueSchema("event name"),
    v.regex(
      EXTERNAL_EVENT_NAME_REGEX,
      'Event name must contain only letters, digits, underscores, hyphens, and dots (e.g., "external_event", "webhook.received", "my-event_123")',
    ),
    v.maxLength(
      MAX_EVENT_NAME_LENGTH,
      `The event name must not be longer than ${MAX_EVENT_NAME_LENGTH} characters`,
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

/** Validates that a text field contains only characters accepted by the Adobe I/O Events API. */
function ioEventsTextSchema(name: string) {
  return v.regex(
    IO_EVENTS_TEXT_REGEX,
    `${name} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`,
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
    nonEmptyStringValueSchema("provider label"),
    ioEventsTextSchema("Provider label"),
    v.maxLength(
      MAX_LABEL_LENGTH,
      `The provider label must not be longer than ${MAX_LABEL_LENGTH} characters`,
    ),
  ),
  description: v.pipe(
    nonEmptyStringValueSchema("provider description"),
    ioEventsTextSchema("Provider description"),
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
    nonEmptyStringValueSchema("event label"),
    ioEventsTextSchema("Event label"),
    v.maxLength(
      MAX_LABEL_LENGTH,
      `The event label must not be longer than ${MAX_LABEL_LENGTH} characters`,
    ),
  ),

  description: v.pipe(
    nonEmptyStringValueSchema("event description"),
    ioEventsTextSchema("Event description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The event description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),

  runtimeActions: v.array(
    v.pipe(
      nonEmptyStringValueSchema("runtime action"),
      v.regex(
        /^[a-z0-9-]+\/[a-z0-9-]+$/i,
        'Runtime action must be in the format "<package>/<action>" (e.g., "my-package/my-action")',
      ),
    ),
    "Expected an array of runtime actions in the format <package>/<action>",
  ),

  env: v.optional(CommerceEnvArraySchema),
});

/**
 * Schema for rule operator values.
 * Valid operators for Commerce event filtering rules.
 */
const OPERATORS = [
  "greaterThan",
  "lessThan",
  "equal",
  "regex",
  "in",
  "onChange",
] as const;
const ruleOperatorSchema = v.union(
  OPERATORS.map((op) => v.literal(op)),
  `Operator must be one of: ${OPERATORS.join(", ")}`,
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
  fields: v.pipe(
    v.array(
      commerceEventFieldSchema(),
      "Expected an array of event field objects with a 'name' property",
    ),
    v.minLength(
      1,
      "The Commerce event configuration must define at least one field",
    ),
  ),
  rules: v.optional(
    v.array(
      CommerceEventRuleSchema,
      "Expected an array of event rules with field, operator, and value",
    ),
  ),

  destination: v.optional(nonEmptyStringValueSchema("destination")),
  hipaa_audit_required: v.optional(booleanValueSchema("hipaa_audit_required")),
  priority: v.optional(booleanValueSchema("priority")),
  force: v.optional(booleanValueSchema("force")),
});

/** Schema for external event configuration */
const ExternalEventSchema = v.object({
  ...BaseEventSchema.entries,
  name: externalEventNameSchema(),
});

/** Schema for Commerce event source configuration */
export const CommerceEventSourceSchema = v.object({
  provider: ProviderSchema,
  events: v.array(CommerceEventSchema, "Expected an array of Commerce events"),
});

/** Schema for external event source configuration */
export const ExternalEventSourceSchema = v.object({
  provider: ProviderSchema,
  events: v.array(ExternalEventSchema, "Expected an array of external events"),
});

/** Schema for eventing configuration with separate commerce and external arrays */
export const EventingSchema = v.object({
  commerce: v.optional(
    v.pipe(
      v.array(
        CommerceEventSourceSchema,
        "Expected an array of Commerce event sources",
      ),
      v.check(
        (sources) =>
          new Set(sources.map((s) => s.provider.label)).size === sources.length,
        "Commerce provider labels must be unique",
      ),
    ),
  ),

  external: v.optional(
    v.pipe(
      v.array(
        ExternalEventSourceSchema,
        "Expected an array of external event sources",
      ),
      v.check(
        (sources) =>
          new Set(sources.map((s) => s.provider.label)).size === sources.length,
        "External provider labels must be unique",
      ),
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

/** Config type when eventing is present. */
export type EventsConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & {
  eventing: NonNullable<T["eventing"]>;
};

/** Config type when commerce event sources are present. */
export type CommerceEventsConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = EventsConfig<T> & {
  eventing: EventsConfig<T>["eventing"] & {
    commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
  };
};

/** Config type when external event sources are present. */
export type ExternalEventsConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = EventsConfig<T> & {
  eventing: EventsConfig<T>["eventing"] & {
    external: NonNullable<EventsConfig<T>["eventing"]["external"]>;
  };
};

/**
 * Check if config has commerce event sources.
 * @param config - The configuration to check.
 */
export function hasCommerceEvents<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & CommerceEventsConfig<T> {
  return (
    Array.isArray(config?.eventing?.commerce) &&
    config.eventing.commerce.length > 0
  );
}

/**
 * Check if config has external event sources.
 * @param config - The configuration to check.
 */
export function hasExternalEvents<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & ExternalEventsConfig<T> {
  return (
    Array.isArray(config?.eventing?.external) &&
    config.eventing.external.length > 0
  );
}

/**
 * Check if config has any eventing configuration.
 * @param config - The configuration to check.
 */
export function hasEventing<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & EventsConfig<T> {
  return config.eventing !== undefined;
}
