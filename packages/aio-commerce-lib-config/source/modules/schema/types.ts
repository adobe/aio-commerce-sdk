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

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { Promisable, Simplify } from "type-fest";
import type * as v from "valibot";
import type { FieldSchema } from "./fields";

/** Context needed for schema operations. */
export type SchemaContext = {
  /** The namespace for isolating schema data. */
  namespace: string;

  /** Cache timeout in milliseconds. */
  cacheTimeout: number;
};

/**
 * The schema type for a configuration field.
 *
 * Represents a single field definition in the configuration schema, which can be
 * one of various types: list, text, password, email, url, phone, or boolean.
 */
type BusinessConfigSchemaFieldInput = v.InferInput<typeof FieldSchema>;

type BusinessConfigSchemaListFieldInput = Extract<
  BusinessConfigSchemaFieldInput,
  { type: "list" }
>;

/**
 * The schema type for an option in a list configuration field.
 * Represents a single option that can be selected in a list-type configuration field.
 */
export type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaListFieldInput["options"],
  readonly unknown[]
>[number];

/**
 * Factory function that resolves list options at runtime.
 *
 * The factory receives the App Builder runtime action params for the action
 * resolving the schema.
 */
export type ListOptionsFactory = (
  params: RuntimeActionParams,
) => Promisable<BusinessConfigSchemaListOption[]>;

/** Static or runtime-resolved options for a list configuration field. */
export type ListOptionsValue =
  | BusinessConfigSchemaListOption[]
  | ListOptionsFactory;

/** Static representation of a list configuration field. */
type BusinessConfigSchemaListField = Omit<
  BusinessConfigSchemaListFieldInput,
  "options"
> & {
  options: BusinessConfigSchemaListOption[];
};

/** Dynamic or static representation of a list configuration field. */
type MaybeDynamicBusinessConfigSchemaListField = Omit<
  BusinessConfigSchemaListField,
  "options"
> & {
  options: ListOptionsValue;
};

/**
 * The schema type for a configuration field.
 *
 * Represents a single field definition in the configuration schema, which can be
 * one of various types: list, text, password, email, url, phone, or boolean.
 */
export type BusinessConfigSchemaField = Simplify<
  | Exclude<BusinessConfigSchemaFieldInput, { type: "list" }>
  | BusinessConfigSchemaListField
>;

/** Static schema field or list field with runtime-resolved options. */
export type MaybeDynamicBusinessConfigSchemaField = Simplify<
  | Exclude<BusinessConfigSchemaField, { type: "list" }>
  | MaybeDynamicBusinessConfigSchemaListField
>;

/** Represents an array of configuration field definitions that make up the complete (static) business configuration schema. */
export type BusinessConfigSchema = BusinessConfigSchemaField[];

/** Represents an array of configuration field definitions that make up the complete (static or dynamic) business configuration schema. */
export type MaybeDynamicBusinessConfigSchema =
  | BusinessConfigSchema
  | MaybeDynamicBusinessConfigSchemaField[];

/** Supported value types for a business configuration schema field. */
export type BusinessConfigSchemaValue = BusinessConfigSchemaField["default"];

/** Represents the output type of a business configuration schema field after validation and Valibot parsing. */
export type BusinessConfigSchemaFieldOutput = v.InferOutput<typeof FieldSchema>;

/** Represents the output type of a business configuration schema after validation and Valibot parsing. */
export type BusinessConfigSchemaOutput = BusinessConfigSchemaFieldOutput[];
