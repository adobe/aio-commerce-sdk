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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import { ListSchema, SchemaBusinessConfigSchema } from "./fields";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type {
  BusinessConfigSchema,
  BusinessConfigSchemaField,
  BusinessConfigSchemaListOption,
  DynamicListField,
  ResolvedBusinessConfigSchema,
} from "./types";

/**
 * Validates a business configuration schema.
 *
 * @param value - The business configuration schema to validate.
 * @returns Validated schema (may contain `dynamicList` fields).
 *
 * @throws {CommerceSdkValidationError} If the schema is invalid.
 */
export function validateBusinessConfigSchema(value: unknown) {
  return parseOrThrow(SchemaBusinessConfigSchema, value);
}

/**
 * Gets password field names from the schema.
 *
 * @param schema - The resolved schema to read.
 * @returns Set of field names that are of type "password".
 */
export function getPasswordFields(schema: ResolvedBusinessConfigSchema) {
  return new Set(
    schema
      .filter((field) => field.type === "password")
      .map((field) => field.name),
  );
}

/**
 * Whether a business configuration schema contains any `dynamicList` fields
 * that need runtime resolution before use.
 *
 * @param schema - The schema to inspect.
 */
export function hasDynamicSchema(schema: BusinessConfigSchema): boolean {
  return schema.some((field) => field.type === "dynamicList");
}

async function resolveDynamicListField(
  field: DynamicListField,
  params: RuntimeActionParams,
): Promise<BusinessConfigSchemaField> {
  let options: BusinessConfigSchemaListOption[];
  try {
    options = await field.options(params);
  } catch (error) {
    throw new Error(
      `Failed to resolve options for dynamicList field "${field.name}"`,
      { cause: error },
    );
  }

  const candidate = {
    name: field.name,
    label: field.label,
    description: field.description,
    env: field.env,
    type: "list",
    selectionMode: field.selectionMode,
    options,
    default: field.default?.(options),
  };

  return parseOrThrow(
    ListSchema,
    candidate,
    `Invalid resolved value for dynamicList field "${field.name}"`,
  );
}

/**
 * Resolves any dynamic parts of a business configuration schema into a static
 * one suitable for validation, storage, and rendering.
 *
 * @param schema - Schema as the developer defined it; may contain `dynamicList` fields.
 * @param params - Runtime action params forwarded to each `dynamicList` factory.
 * @returns A new, fully resolved schema. The input is not mutated.
 *
 * @throws {CommerceSdkValidationError} If a factory returns data that do not
 * match the expected schema shape.
 *
 * @example
 * ```ts
 * const schema: BusinessConfigSchema = [
 *   {
 *     name: "paymentMethod",
 *     type: "dynamicList",
 *     selectionMode: "single",
 *     options: async (params) => fetchPaymentMethods(params.SOME_API_KEY),
 *     default: (opts) => opts[0].value,
 *   },
 * ];
 *
 * const resolved = await resolveBusinessConfigSchema(schema, params);
 * ```
 */
// biome-ignore lint/suspicious/useAwait: keep `async` so sync throws surface as rejections
export async function resolveBusinessConfigSchema(
  schema: BusinessConfigSchema,
  params: RuntimeActionParams,
): Promise<ResolvedBusinessConfigSchema> {
  return Promise.all(
    schema.map((field) =>
      field.type === "dynamicList"
        ? resolveDynamicListField(field, params)
        : field,
    ),
  );
}
