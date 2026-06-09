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

import { commerceEnvArraySchema } from "@adobe/aio-commerce-lib-core/commerce";
import * as v from "valibot";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

// Supports one level of nested parens in URLs (e.g. Wikipedia-style links).
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(((?:[^)(]|\([^)]*\))*)\)/g;
const SAFE_URL_REGEX = /^https?:\/\//i;

/**
 * Returns true if every Markdown link in `text` is well-formed and uses an http(s) URL.
 * Plain text with no links always passes.
 */
function validateMarkdownLink(text: string): boolean {
  for (const match of text.matchAll(MARKDOWN_LINK_REGEX)) {
    if (!SAFE_URL_REGEX.test(match[2].trim())) {
      return false;
    }
  }
  return true;
}

const DEFAULT_BOOLEAN_VALUE = false as const;
const DEFAULT_STRING_VALUE = "" as const;
const DEFAULT_MULTIPLE_LIST_VALUE = [] as const;

/**
 * Base schema for configuration field options with name, optional label,
 * optional description, and optional `env` to scope the field to specific
 * Commerce environments (when omitted, the field applies to all environments).
 */
const BaseOptionSchema = v.object({
  name: v.pipe(
    v.string("Expected a string for the field name"),
    v.nonEmpty("The field name must not be empty"),
  ),
  label: v.optional(v.string("Expected a string for the field label")),
  description: v.optional(
    v.pipe(
      v.string("Expected a string for the field description"),
      v.check(
        validateMarkdownLink,
        "Field description contains an invalid markdown URL.",
      ),
    ),
  ),
  env: v.optional(commerceEnvArraySchema),
});

/** Schema for a single option in a list field, containing a display label and a value */
export const ListOptionSchema = v.object({
  label: v.string("Expected a string for the option label"),
  value: v.string("Expected a string for the option value"),
});

type ListOptionShape = v.InferInput<typeof ListOptionSchema>;

/** Entries shared between the single- and multiple-selection list field schemas. */
const ListEntriesCommon = {
  ...BaseOptionSchema.entries,
  type: v.literal("list", "Expected the type to be 'list'"),
  options: v.array(ListOptionSchema, "Expected an array of list options"),
};

/** Schema for a list field that allows single selection from a list of options */
const SingleListSchema = v.object({
  ...ListEntriesCommon,
  selectionMode: v.literal(
    "single",
    "Expected the selectionMode to be 'single'",
  ),
  default: v.pipe(
    v.string("Expected a string for the default value"),
    v.nonEmpty("The default value must not be empty"),
  ),
});

/** Schema for a list field that allows multiple selections from a list of options */
const MultipleListSchema = v.object({
  ...ListEntriesCommon,
  selectionMode: v.literal(
    "multiple",
    "Expected the selectionMode to be 'multiple'",
  ),
  default: v.optional(
    v.array(
      v.pipe(
        v.string("Expected a string for each default value"),
        v.nonEmpty("Each default value must not be empty"),
      ),
      "Expected an array of default values",
    ),
    DEFAULT_MULTIPLE_LIST_VALUE,
  ),
});

/** Schema for list fields supporting either single or multiple selection modes */
export const ListSchema = v.variant("selectionMode", [
  SingleListSchema,
  MultipleListSchema,
]);

/** Schema for a text input field that accepts string values */
const TextSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("text", "Expected the type to be 'text'"),
  default: v.optional(
    v.string("Expected a string for the default value"),
    DEFAULT_STRING_VALUE,
  ),
});

/** Schema for a password input field that accepts string values (typically masked in UI) */
const PasswordSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("password", "Expected the type to be 'password'"),
  default: v.optional(
    v.literal(
      DEFAULT_STRING_VALUE,
      "Password fields do not have a default value",
    ),
    DEFAULT_STRING_VALUE,
  ),
});

/** Schema for an email input field that accepts and validates email addresses */
const EmailSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("email", "Expected the type to be 'email'"),
  default: v.optional(
    v.union([
      v.literal(DEFAULT_STRING_VALUE),
      v.pipe(
        v.string("Expected a string for the default email value"),
        v.email("The email must be a valid email address"),
      ),
    ]),
    DEFAULT_STRING_VALUE,
  ),
});

/** Schema for a URL input field that accepts and validates URL strings */
const UrlSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("url", "Expected the type to be 'url'"),
  default: v.optional(
    v.union([
      v.literal(DEFAULT_STRING_VALUE),
      v.pipe(
        v.string("Expected a string for the default URL value"),
        v.url("The URL must be a valid URL"),
      ),
    ]),
    DEFAULT_STRING_VALUE,
  ),
});

/** Schema for a phone number input field that accepts and validates telephone numbers */
const PhoneSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("tel", "Expected the type to be 'tel'"),
  default: v.optional(
    v.union([
      v.literal(DEFAULT_STRING_VALUE),
      v.pipe(
        v.string("Expected a string for the default phone number value"),
        v.regex(
          /^\+?[0-9\s\-()]+$/,
          "The phone number must contain only numbers and/or country codes",
        ),
      ),
    ]),
    DEFAULT_STRING_VALUE,
  ),
});

/** Schema for a boolean toggle field that accepts true/false values */
const BooleanSchema = v.object({
  ...BaseOptionSchema.entries,
  type: v.literal("boolean", "Expected the type to be 'boolean'"),
  default: v.optional(
    v.boolean("Expected a boolean for the default value"),
    DEFAULT_BOOLEAN_VALUE,
  ),
});

type OptionsFactory = (
  params: RuntimeActionParams,
) => ListOptionShape[] | Promise<ListOptionShape[]>;

/** Entries shared between the single- and multiple-selection dynamic list field schemas. */
const DynamicListEntriesCommon = {
  ...BaseOptionSchema.entries,
  type: v.literal("dynamicList", "Expected the type to be 'dynamicList'"),
  options: v.custom<OptionsFactory>(
    (input) => typeof input === "function",
    'Expected a function for "options"',
  ),
};

type SingleDefaultFactory = (resolvedOptions: ListOptionShape[]) => string;

/** Schema for a dynamic list field that allows single selection. */
const SingleDynamicListSchema = v.object({
  ...DynamicListEntriesCommon,
  selectionMode: v.literal(
    "single",
    "Expected the selectionMode to be 'single'",
  ),
  default: v.custom<SingleDefaultFactory>(
    (input) => typeof input === "function",
    'Expected a function for "default"',
  ),
});

type MultipleDefaultFactory = (resolvedOptions: ListOptionShape[]) => string[];

/** Schema for a dynamic list field that allows multiple selections. */
const MultipleDynamicListSchema = v.object({
  ...DynamicListEntriesCommon,
  selectionMode: v.literal(
    "multiple",
    "Expected the selectionMode to be 'multiple'",
  ),
  default: v.optional(
    v.custom<MultipleDefaultFactory>(
      (input) => typeof input === "function",
      'Expected a function for "default"',
    ),
  ),
});

/** Schema for dynamic list fields supporting either single or multiple selection modes. */
export const DynamicListSchema = v.variant("selectionMode", [
  SingleDynamicListSchema,
  MultipleDynamicListSchema,
]);

/** Schema for a single configuration field. */
export const FieldSchema = v.variant("type", [
  ListSchema,
  DynamicListSchema,
  TextSchema,
  PasswordSchema,
  EmailSchema,
  UrlSchema,
  PhoneSchema,
  BooleanSchema,
]);

/** Schema for the business configuration schema. */
export const SchemaBusinessConfigSchema = v.pipe(
  v.array(FieldSchema, "Expected an array of configuration fields"),
  v.minLength(1, "At least one configuration parameter is required"),
);
