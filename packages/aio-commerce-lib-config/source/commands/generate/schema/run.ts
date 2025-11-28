/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { execSync } from "node:child_process";
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
  execSync("npx aio-commerce-lib-config validate schema", { stdio: "inherit" });
  const validatedSchema = await loadBusinessConfigSchema();

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
