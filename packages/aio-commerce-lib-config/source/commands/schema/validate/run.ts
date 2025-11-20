import { stringifyError } from "#commands/utils";

import { loadBusinessConfigSchema } from "./lib";
import { logger } from "./logger";

/**
 * Validate the configuration schema.
 * @returns The validated schema.
 */
export async function run() {
  logger.info("🔍 Validating configuration schema...");

  try {
    const result = await loadBusinessConfigSchema();
    if (result !== null) {
      logger.info("✅ Configuration schema validation passed.\n");
      return result;
    }

    logger.info("⚠️ No schema found to validate.\n");
    return null;
  } catch (error) {
    logger.error(stringifyError(error as Error));
    logger.error("❌ Configuration schema validation failed\n");

    throw new Error("Configuration schema validation failed", { cause: error });
  }
}
