import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

import { DEFAULT_INIT_SCHEMA_PATH } from "../../../utils/constants";
import { logger } from "./logger";
import { check } from "./validator";

export async function run() {
  const configPath = DEFAULT_INIT_SCHEMA_PATH;
  logger.info("\n🔄 Analyzing configuration schema...\n");

  if (!configPath) {
    logger.error("\n❌ extensibility.config.js file is not found.\n");
    process.exit(1);
  }

  try {
    const result = await check(configPath);
    if (result.validated) {
      logger.info("\n✅ Configuration schema validation passed.\n");
    } else {
      logger.info("\n⚠️ No schema found to validate.\n");
    }
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      logger.error(
        "\n❌ Configuration schema validation failed:\n",
        error.display(true),
      );
    }

    throw new Error("\n❌ Configuration schema validation failed\n", {
      cause: error,
    });
  }
}
