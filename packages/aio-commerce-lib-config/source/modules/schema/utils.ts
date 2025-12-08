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
import { readFile } from "node:fs/promises";

import { validateConfigDomain } from "@adobe/aio-commerce-lib-extensibility/config";

import { CONFIG_SCHEMA_PATH } from "#utils/constants";

import type { ConfigSchemaField } from "./types";

/**
 * Reads bundled schema file from the runtime action.
 *
 * @returns Promise resolving to schema file content as JSON string, or empty array JSON if file not found.
 */
export async function readBundledSchemaFile(): Promise<string> {
  try {
    const configPath = CONFIG_SCHEMA_PATH;
    return await readFile(configPath, "utf-8");
  } catch (_error) {
    return JSON.stringify([]);
  }
}

/**
 * Calculates schema version hash from content.
 *
 * @param content - Schema content as string.
 * @returns Schema version hash (first 8 characters of SHA-256 hash).
 */
export function calculateSchemaVersion(content: string): string {
  const hashSubstringLength = 8;
  return createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, hashSubstringLength);
}

/**
 * Reads bundled schema file and returns both content and calculated version.
 *
 * @returns Promise resolving to object with schema content and version hash.
 */
export async function readBundledSchemaWithVersion(): Promise<{
  content: string;
  version: string;
}> {
  const content = await readBundledSchemaFile();
  const version = calculateSchemaVersion(content);
  return { content, version };
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
  return validateConfigDomain(
    value,
    "businessConfig.schema",
  ) satisfies ConfigSchemaField[];
}

/**
 * Validates and parses schema from JSON content.
 *
 * @param content - Schema content as JSON string.
 * @returns Validated schema as array of config schema fields.
 *
 * @throws {SyntaxError} If JSON parsing fails.
 * @throws {CommerceSdkValidationError} If the schema is invalid.
 */
export function validateSchemaFromContent(content: string) {
  const rawSchema = JSON.parse(content);
  return validateBusinessConfigSchema(rawSchema);
}
