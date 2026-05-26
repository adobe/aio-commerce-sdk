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
import type { SchemaBusinessConfigSchema } from "./fields";

/** Context needed for schema operations. */
export type SchemaContext = {
  /** The namespace for isolating schema data. */
  namespace: string;

  /** Cache timeout in milliseconds. */
  cacheTimeout: number;
};

/** A business configuration schema as the developer writes it. */
export type BusinessConfigSchema = v.InferInput<
  typeof SchemaBusinessConfigSchema
>;

/** A single static configuration field (one of: list, text, password, email, url, phone, boolean). */
export type BusinessConfigSchemaField = Exclude<
  BusinessConfigSchema[number],
  { type: "dynamicList" }
>;

/** A `dynamicList` configuration field — options (and optionally `default`) are resolved at runtime. */
export type DynamicListField = Extract<
  BusinessConfigSchema[number],
  { type: "dynamicList" }
>;

/** A single option in a `list` configuration field. */
export type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  { type: "list" }
>["options"][number];

/** Business configuration schema after dynamic resolution — only static field types. */
export type ResolvedBusinessConfigSchema = BusinessConfigSchemaField[];

/** Supported default value types across all business configuration schema fields. */
export type BusinessConfigSchemaValue = BusinessConfigSchemaField["default"];
