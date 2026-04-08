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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";
import stringify from "safe-stable-stringify";

import { SchemaBusinessConfig } from "./index";

import type { BusinessConfigSchema } from "./types";

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
  return parseOrThrow(
    SchemaBusinessConfig.entries.schema,
    value,
  ) satisfies BusinessConfigSchema;
}

/**
 * Gets password field names from the schema.
 *
 * @param namespace - The namespace to get the schema from.
 * @returns Set of field names that are of type "password".
 */
export function getPasswordFields(schema: BusinessConfigSchema) {
  return new Set(
    schema
      .filter((field) => field.type === "password")
      .map((field) => field.name),
  );
}
