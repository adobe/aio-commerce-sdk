import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

import { logger } from "./logger";
import { check } from "./validator";

export async function run() {
  const configPath = process.env.CONFIG_SCHEMA_PATH;
  logger.info("\n🔄 Analyzing configuration schema...\n");

  if (!configPath) {
    logger.error("\n❌ CONFIG_SCHEMA_PATH environment variable is not set.\n");
    process.exit(1);
  }

  try {
    await check(configPath);
    logger.info("\n✅ Configuration schema validation passed.\n");
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      logger.error(
        "\n❌ Configuration schema validation failed:\n",
        error.display(true),
      );
    }

    throw new Error("Configuration schema validation failed", { cause: error });
  }
}
