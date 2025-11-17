import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { CONFIG_SCHEMA_FILE_NAME, GENERATED_PATH } from "#commands/constants";
import { run as validateSchemaCommand } from "#commands/schema/validate/run";
import { makeOutputDirFor } from "#commands/utils";

import { logger } from "./logger";

/** Run the generate schema command */
export async function run() {
  logger.info("🔧 Generating schema file...");

  const validatedSchema = await validateSchemaCommand();
  await generateSchemaFile(validatedSchema);
}

/** Generate the schema file */
async function generateSchemaFile(validatedSchema?: unknown) {
  const outputDir = await makeOutputDirFor(GENERATED_PATH);
  const schemaPath = join(outputDir, CONFIG_SCHEMA_FILE_NAME);
  const schemaContent = validatedSchema ? validatedSchema : [];

  await writeFile(schemaPath, JSON.stringify(schemaContent, null, 2), "utf-8");
  logger.info(`📄 Generated ${CONFIG_SCHEMA_FILE_NAME}\n`);
}
