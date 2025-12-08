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

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import { makeOutputDirFor } from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";

import {
  CONFIG_SCHEMA_FILE_NAME,
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_PATH,
} from "#commands/constants";
import { loadBusinessConfigSchema } from "#commands/schema/validate/lib";

/** Run the generate schema command */
export async function run() {
  try {
    consola.start("Generating schema file...");

    const validatedSchema = await loadBusinessConfigSchema();
    await generateSchemaFile(validatedSchema);

    consola.success(`Generated ${CONFIG_SCHEMA_FILE_NAME}`);
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}

/** Generate the schema file */
async function generateSchemaFile(validatedSchema?: unknown) {
  const outputDir = await makeOutputDirFor(
    join(EXTENSION_POINT_FOLDER_PATH, GENERATED_PATH),
  );

  const schemaPath = join(outputDir, CONFIG_SCHEMA_FILE_NAME);
  const schemaContent = validatedSchema ? validatedSchema : [];

  await writeFile(schemaPath, JSON.stringify(schemaContent, null, 2), "utf-8");
}
