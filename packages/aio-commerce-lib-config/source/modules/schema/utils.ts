import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParse } from "valibot";

import { CONFIG_SCHEMA_PATH } from "../../utils/constants";
import { BusinessConfigSchema } from "./schema";

import type { AnySchema } from "valibot";
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
 * @param schema - The business config own schema to use
 */
export function validateSchema(
  value: unknown,
  schema?: AnySchema,
): ConfigSchemaField[] {
  const schemaToUse = schema ?? BusinessConfigSchema;
  const { output, success, issues } = safeParse(schemaToUse, value);

  if (!success) {
    throw new CommerceSdkValidationError("Invalid configuration schema", {
      issues,
    });
  }

  return output;
}

/**
 * Validate and parse schema from JSON content
 */
export function validateSchemaFromContent(
  content: string,
): ConfigSchemaField[] {
  const rawSchema = JSON.parse(content);
  return validateSchema(rawSchema);
}
