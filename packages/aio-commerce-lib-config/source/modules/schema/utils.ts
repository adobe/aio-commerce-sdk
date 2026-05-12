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

import { createHash } from "node:crypto";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";
import stringify from "safe-stable-stringify";

import { ListOptionsSchema } from "./fields";
import { SchemaBusinessConfig } from "./index";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type {
  BusinessConfigSchema,
  BusinessConfigSchemaOutput,
  ListOptionsFactory,
  MaybeDynamicBusinessConfigSchema,
} from "./types";

/**
 * Calculates schema version hash from content.
 *
 * @param content - Schema content as string.
 * @returns Schema version hash (first 8 characters of SHA-256 hash).
 */
export function calculateSchemaVersion(schema: BusinessConfigSchema): string {
  const content = stringify(schema, null, 2);
  const hashSubstringLength = 8;

  return createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, hashSubstringLength);
}

/**
 * Validates a business configuration schema against the business config schema.
 *
 * @param value - The business configuration schema to validate.
 * @returns Validated schema as array of config schema fields.
 *
 * @throws {CommerceSdkValidationError} If the schema is invalid.
 */
export function validateBusinessConfigSchema(value: unknown) {
  return parseOrThrow(SchemaBusinessConfig.entries.schema, value);
}

/**
 * Checks whether a business configuration schema contains dynamic list options.
 *
 * @param schema - Schema to inspect.
 * @returns True when at least one list field uses an options factory.
 */
export function hasDynamicListOptions(
  schema: MaybeDynamicBusinessConfigSchema,
) {
  return schema.some(
    (field) => field.type === "list" && typeof field.options === "function",
  );
}

/**
 * Checks whether a business configuration schema contains runtime-resolved values.
 *
 * @param schema - Schema to inspect.
 * @returns True when at least one field requires runtime resolution.
 */
export function hasDynamicSchema(schema: MaybeDynamicBusinessConfigSchema) {
  return hasDynamicListOptions(schema);
}

/**
 * Resolves list options in a business configuration schema.
 *
 * @param schema - Schema that may contain list option factories.
 * @param params - Runtime action params to pass to each option factory.
 * @returns A concrete schema with list options resolved to arrays.
 *
 * @throws {CommerceSdkValidationError} If any resolved options are invalid.
 */
export async function resolveBusinessConfigSchema(
  schema: MaybeDynamicBusinessConfigSchema,
  params: RuntimeActionParams,
) {
  if (!hasDynamicListOptions(schema)) {
    return validateBusinessConfigSchema(schema);
  }

  const resolvedFields = await Promise.all(
    schema.map(async (field) => {
      if (field.type !== "list" || typeof field.options !== "function") {
        return field;
      }

      try {
        const options = await (field.options as ListOptionsFactory)(params);
        return {
          ...field,
          options: parseOrThrow(
            ListOptionsSchema,
            options,
            `Invalid options returned for list field "${field.name}"`,
          ),
        };
      } catch (error) {
        if (error instanceof CommerceSdkValidationError) {
          throw error;
        }

        throw new Error(
          `Failed to resolve options for list field "${field.name}"`,
          { cause: error },
        );
      }
    }),
  );

  return validateBusinessConfigSchema(resolvedFields);
}

/**
 * Gets password field names from the schema.
 *
 * @param namespace - The namespace to get the schema from.
 * @returns Set of field names that are of type "password".
 */
export function getPasswordFields(schema: BusinessConfigSchemaOutput) {
  return new Set(
    schema
      .filter((field) => field.type === "password")
      .map((field) => field.name),
  );
}
