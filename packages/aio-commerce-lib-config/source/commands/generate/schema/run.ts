import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  CONFIG_SCHEMA_FILE_NAME,
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_PATH,
} from "#commands/constants";
import { loadBusinessConfigSchema } from "#commands/schema/validate/lib";
import { makeOutputDirFor } from "#commands/utils";

import { logger } from "./logger";

/** Run the generate schema command */
export async function run() {
  logger.info("🔍 Validating configuration schema...");
  const validatedSchema = await loadBusinessConfigSchema();

  if (validatedSchema === null) {
    logger.info("❌ Configuration schema validation failed.\n");
    return;
  }

  logger.info("🔧 Generating schema file...");
  await generateSchemaFile(validatedSchema);
}

/** Generate the schema file */
async function generateSchemaFile(validatedSchema?: unknown) {
  const outputDir = await makeOutputDirFor(
    join(EXTENSION_POINT_FOLDER_PATH, GENERATED_PATH),
  );

  const schemaPath = join(outputDir, CONFIG_SCHEMA_FILE_NAME);
  const schemaContent = validatedSchema ? validatedSchema : [];

  await writeFile(schemaPath, JSON.stringify(schemaContent, null, 2), "utf-8");
  logger.info(`📄 Generated ${CONFIG_SCHEMA_FILE_NAME}\n`);
}
