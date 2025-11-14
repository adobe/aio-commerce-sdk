import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { createJiti } from "jiti";

import { validateSchema } from "#modules/schema/utils";

import { logger } from "./logger";

import type { ExtensibilityConfig } from "#modules/schema/types";

/**
 * Load the business configuration schema from the given path.
 * @param configPath - The path to the configuration file.
 */
export async function loadBusinessConfigSchema(configPath: string) {
  logger.debug(`Validating configuration file at path: ${configPath}`);
  const resolvedPath = resolve(process.cwd(), configPath);

  if (!existsSync(resolvedPath)) {
    logger.warn(`Extensibility config file not found at ${resolvedPath}`);
    return null;
  }

  try {
    const jiti = createJiti(import.meta.url);
    const extensibilityConfig =
      await jiti.import<ExtensibilityConfig>(resolvedPath);

    const businessConfigSchema = extensibilityConfig.businessConfig?.schema;

    if (!businessConfigSchema) {
      logger.warn(
        "\n⚠️ No businessConfig.schema found in extensibility.config.js, skipping validation.\n",
      );

      return null;
    }

    const validatedSchema = validateSchema(businessConfigSchema);
    return validatedSchema;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error loading extensibility.config.js: ${message}`);

    throw new Error(`Error loading extensibility.config.js: ${message}`);
  }
}
