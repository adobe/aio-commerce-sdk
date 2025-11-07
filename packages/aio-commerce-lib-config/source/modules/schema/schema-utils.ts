import { resolve } from "node:path";

import { createJiti } from "jiti";

import { CONFIG_SCHEMA_PATH } from "../../utils/constants";
import { validate } from "./validation/validator";

import type { ConfigSchemaField } from "./index";

/**
 * Read bundled schema file from the runtime action
 */
export async function readBundledSchemaFile(): Promise<string> {
  try {
    const configPath = CONFIG_SCHEMA_PATH;
    const resolvedPath = resolve(process.cwd(), configPath);

    //   transform: Returns source as-is to avoid bundling issues
    //   In runtime, actions are bundled (webpack/esbuild) and jiti's internal Babel
    //   dependency won't be available. By passing through the source
    //   unchanged, we skip transformation for extensibility.config.js which is
    //   already valid CommonJS. To consider this if file changes in the future.
    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
      moduleCache: false,
      transform: (opts) => ({ code: opts.source }),
    });

    const extensibilityConfig = (await jiti.import(resolvedPath)) as {
      businessConfig?: {
        schema?: unknown;
      };
    };

    const businessConfigSchema = extensibilityConfig.businessConfig?.schema;
    if (!businessConfigSchema) {
      return JSON.stringify([]);
    }

    return JSON.stringify(businessConfigSchema);
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
