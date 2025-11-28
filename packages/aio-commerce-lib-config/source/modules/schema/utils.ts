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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParse } from "valibot";

import { CONFIG_SCHEMA_PATH } from "../../utils/constants";
import { BusinessConfigSchema } from "./schema";

import type { ConfigSchemaField } from "./index";

/** Read bundled schema file from the runtime action */
export async function readBundledSchemaFile(): Promise<string> {
  try {
    const configPath = CONFIG_SCHEMA_PATH;
    return await readFile(configPath, "utf-8");
  } catch (_error) {
    return JSON.stringify([]);
  }
}

/**
 * Calculate schema version hash from content
 */
export function calculateSchemaVersion(content: string): string {
  const hashSubstringLength = 8;
  return createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, hashSubstringLength);
}

/**
 * Read bundled schema file and return both content and calculated version
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
 * Validate a business configuration schema, against the business config own schema.
 * @param value - The business configuration schema to validate
 */
export function validateBusinessConfigSchema(value: unknown) {
  const { output, success, issues } = safeParse(BusinessConfigSchema, value);

  if (!success) {
    throw new CommerceSdkValidationError("Invalid configuration schema", {
      issues,
    });
  }

  return output satisfies ConfigSchemaField[];
}

/** Validate and parse schema from JSON content */
export function validateSchemaFromContent(content: string) {
  const rawSchema = JSON.parse(content);
  return validateBusinessConfigSchema(rawSchema) satisfies ConfigSchemaField[];
}
