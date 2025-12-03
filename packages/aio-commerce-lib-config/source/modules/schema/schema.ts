/*
 * Copyright 2025 Adobe. All rights reserved.
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

/** Base schema for configuration field options with name, optional label, and optional description */
export const BaseOptionSchema = v.object({
  name: v.pipe(
    v.string("Expected a string for the field name"),
    v.nonEmpty("The field name must not be empty"),
  ),
  label: v.optional(v.string("Expected a string for the field label")),
  description: v.optional(
    v.string("Expected a string for the field description"),
  ),
});

/** Schema for a single option in a list field, containing a display label and a value */
const ListOptionSchema = v.object({
  label: v.string("Expected a string for the option label"),
  value: v.string("Expected a string for the option value"),
});

/** Schema for a list field that allows single selection from a list of options */
const SingleListSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("list", "Expected the type to be 'list'"),

  selectionMode: v.literal(
    "single",
    "Expected the selectionMode to be 'single'",
  ),
  options: v.array(ListOptionSchema, "Expected an array of list options"),
  default: v.pipe(
    v.string("Expected a string for the default value"),
    v.nonEmpty("The default value must not be empty"),
  ),
});

/** Schema for a list field that allows multiple selections from a list of options */
const MultipleListSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("list", "Expected the type to be 'list'"),

  selectionMode: v.literal(
    "multiple",
    "Expected the selectionMode to be 'multiple'",
  ),
  options: v.array(ListOptionSchema, "Expected an array of list options"),
  default: v.optional(
    v.array(
      v.pipe(
        v.string("Expected a string for each default value"),
        v.nonEmpty("Each default value must not be empty"),
      ),
      "Expected an array of default values",
    ),
    [],
  ),
});

/** Schema for list fields supporting either single or multiple selection modes */
const ListSchema = v.variant("selectionMode", [
  SingleListSchema,
  MultipleListSchema,
]);

/** Schema for a text input field that accepts string values */
const TextSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("text", "Expected the type to be 'text'"),
  default: v.optional(v.string("Expected a string for the default value")),
});

/** Schema for a password input field that accepts string values (typically masked in UI) */
/* const PasswordSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("password", "Expected the type to be 'password'"),
  default: v.optional(v.string("Expected a string for the default value")),
}); */

/** Schema for a boolean field that accepts true or false values */
/* const BooleanSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("boolean", "Expected the type to be 'boolean'"),
  default: v.optional(v.boolean("Expected a boolean for the default value")),
}); */

/** Schema for a number input field that accepts numeric values */
/* const NumberSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("number", "Expected the type to be 'number'"),
  default: v.optional(v.number("Expected a number for the default value")),
}); */

/** Schema for a date input field that accepts date values */
/* const DateSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("date", "Expected the type to be 'date'"),
  default: v.optional(v.date("Expected a date for the default value")),
}); */

/** Schema for an email input field that accepts and validates email addresses */
const EmailSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("email", "Expected the type to be 'email'"),
  default: v.optional(
    v.pipe(
      v.string("Expected a string for the default email value"),
      v.email("The email must be a valid email address"),
    ),
  ),
});

/** Schema for a URL input field that accepts and validates URL strings */
const UrlSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("url", "Expected the type to be 'url'"),
  default: v.optional(
    v.pipe(
      v.string("Expected a string for the default URL value"),
      v.url("The URL must be a valid URL"),
    ),
  ),
});

/** Schema for a phone number input field that accepts and validates telephone numbers */
const PhoneSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("tel", "Expected the type to be 'tel'"),
  default: v.optional(
    v.pipe(
      v.string("Expected a string for the default phone number value"),
      v.regex(
        /^\+?[0-9\s\-()]+$/,
        "The phone number must contain only numbers and/or country codes",
      ),
    ),
  ),
});

/** Schema for a configuration field that can be one of various field types (list, text, password, boolean, number, date, email, url, or phone) */
const FieldSchema = v.variant("type", [
  ListSchema,
  TextSchema,
  // PasswordSchema,
  // BooleanSchema,
  // NumberSchema,
  // DateSchema,
  EmailSchema,
  UrlSchema,
  PhoneSchema,
]);

/** Schema for the business configuration, which is an array of configuration fields with at least one field required */
export const BusinessConfigSchema = v.pipe(
  v.array(FieldSchema, "Expected an array of configuration fields"),
  v.minLength(1, "At least one configuration parameter is required"),
);

/**
 * The schema type for a configuration field.
 *
 * Represents a single field definition in the configuration schema, which can be
 * one of various types: list, text, password, boolean, number, date, email, url, or phone.
 */
export type ConfigSchemaField = v.InferInput<typeof FieldSchema>;

/**
 * The schema type for the business configuration schema.
 *
 * Represents an array of configuration field definitions that make up the complete
 * business configuration schema. Must contain at least one field.
 */
export type BusinessConfigSchema = v.InferInput<typeof BusinessConfigSchema>;

/**
 * The schema type for an option in a list configuration field.
 * Represents a single option that can be selected in a list-type configuration field.
 */
export type ConfigSchemaOption = Extract<
  ConfigSchemaField,
  { type: "list" }
>["options"][number];
