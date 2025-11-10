import { readFile } from "node:fs/promises";

import { CONFIG_SCHEMA_PATH } from "../../utils/constants";
import { validate } from "./validation/validator";

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
const HASH_SUBSTRING_LENGTH = 8;

export function calculateSchemaVersion(content: string): string {
  const crypto = require("node:crypto");
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, HASH_SUBSTRING_LENGTH);
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
 * Validate and parse schema from JSON content
 */
export function validateSchemaFromContent(
  content: string,
): ConfigSchemaField[] {
  const rawSchema = JSON.parse(content);
  return validate(rawSchema);
}
