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

import type * as v from "valibot";
import type { FieldSchema, SchemaBusinessConfigSchema } from "./fields";

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
 * one of various types: list, text, password, email, url, or phone.
 */
export type BusinessConfigSchemaField = v.InferInput<typeof FieldSchema>;

/**
 * The schema type for the business configuration schema.
 *
 * Represents an array of configuration field definitions that make up the complete
 * business configuration schema. Must contain at least one field.
 */
export type BusinessConfigSchema = v.InferInput<
  typeof SchemaBusinessConfigSchema
>;

/** The schema type for the business configuration schema. */
export type BusinessConfigSchemaValue = BusinessConfigSchemaField["default"];

/**
 * The schema type for an option in a list configuration field.
 * Represents a single option that can be selected in a list-type configuration field.
 */
export type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  { type: "list" }
>["options"][number];
