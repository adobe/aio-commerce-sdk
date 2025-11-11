import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

import { DEFAULT_INIT_SCHEMA_PATH } from "../../../utils/constants";
import { logger } from "./logger";
import { check } from "./validator";

export async function run() {
  const configPath = DEFAULT_INIT_SCHEMA_PATH;
  logger.info("🔄 Analyzing configuration schema...");

  if (!configPath) {
    logger.error("❌ extensibility.config.js file is not found.\n");
    process.exit(1);
  }

  try {
    const result = await check(configPath);
    if (result.validated) {
      logger.info("✅ Configuration schema validation passed.\n");
      return result.schema;
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
