import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  CONFIG_SCHEMA_FILE_NAME,
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_PATH,
} from "#commands/constants";
import { loadBusinessConfigSchema } from "#commands/schema/validate/lib";
import { makeOutputDirFor } from "#commands/utils";

/** Run the generate schema command */
export async function run() {
  process.stdout.write("\n🔍 Validating configuration schema...\n");
  const validatedSchema = await loadBusinessConfigSchema();

  if (validatedSchema === null) {
    process.stdout.write("❌ Configuration schema validation failed.\n");
    return;
  }

  process.stdout.write("🔧 Generating schema file...\n");
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
  process.stdout.write(`📄 Generated ${CONFIG_SCHEMA_FILE_NAME}\n`);
}
