import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

import { loadBusinessConfigSchema } from "./lib";
import { logger } from "./logger";

/** Default configuration schema path for init files. */
const EXTENSIBILITY_CONFIG_FILE = "extensibility.config.js";

/**
 * Validate the configuration schema.
 * @returns The validated schema.
 */
export async function run() {
  logger.info("🔄 Analyzing configuration schema...");

  try {
    const result = await loadBusinessConfigSchema(EXTENSIBILITY_CONFIG_FILE);
    if (result !== null) {
      logger.info("✅ Configuration schema validation passed.\n");
      return result;
    }

    logger.info("⚠️ No schema found to validate.\n");
    return null;
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      logger.error(
        "❌ Configuration schema validation failed:\n",
        error.display(true),
      );
    }

    throw new Error("Configuration schema validation failed", {
      cause: error,
    });
  }
}
