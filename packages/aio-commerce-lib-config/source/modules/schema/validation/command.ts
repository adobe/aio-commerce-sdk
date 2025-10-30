import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

import { check } from "./validator";

const LIB_NAME = "@adobe/aio-commerce-lib-config";

export async function run() {
  const configPath = process.env.CONFIG_SCHEMA_PATH;
  console.info(`\n🔄 ${LIB_NAME}: Analyzing configuration schema...\n`);

  if (!configPath) {
    console.error(
      `\n❌ ${LIB_NAME}: CONFIG_SCHEMA_PATH environment variable is not set.\n`,
    );
    process.exit(1);
  }

  try {
    await check(configPath);
    console.info(`\n✅ ${LIB_NAME}: Configuration schema validation passed.\n`);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      console.error(
        `\n❌ ${LIB_NAME}: Configuration schema validation failed:\n`,
        error.display(true),
      );
    }

    throw new Error(
      `${LIB_NAME}: Configuration schema validation failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
    );
  }
}
