import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { createJiti } from "jiti";
import { safeParse } from "valibot";

import { logger } from "./logger";
import { RootSchema } from "./schema";

import type { AnySchema } from "valibot";

export async function check(configPath: string) {
  logger.debug(`Validating configuration file at path: ${configPath}`);

  const resolvedPath = resolve(process.cwd(), configPath);

  if (!existsSync(resolvedPath)) {
    logger.warn(`Extensibility config file not found at ${resolvedPath}`);
    return { validated: false };
  }

  let businessConfigSchema: unknown;

  try {
    const jiti = createJiti(import.meta.url);
    const extensibilityConfig = (await jiti.import(resolvedPath)) as {
      businessConfig?: {
        schema?: unknown;
      };
    };

    businessConfigSchema = extensibilityConfig.businessConfig?.schema;
  } catch (error) {
    logger.error(
      `Error loading extensibility.config.js: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw new Error(
      `Error loading extensibility.config.js: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  if (!businessConfigSchema) {
    logger.warn(
      "\n⚠️ No businessConfig.schema found in extensibility.config.js, skipping validation.\n",
    );
    return { validated: false };
  }

  validate(businessConfigSchema);
  return { validated: true };
}

export function validate(value: unknown, schema?: AnySchema) {
  const schemaToUse = schema ?? RootSchema;
  const { output, success, issues } = safeParse(schemaToUse, value);

  if (!success) {
    throw new CommerceSdkValidationError("Invalid configuration schema", {
      issues,
    });
  }

  return output;
}
