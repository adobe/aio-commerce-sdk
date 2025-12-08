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
  EXTENSIBILITY_MANIFEST_FILE,
  EXTENSION_POINT_FOLDER_PATH,
} from "#commands/constants";
import { parseExtensibilityConfig } from "#config/lib/parser";

/** Run the generate manifest command */
export async function run() {
  consola.start("Generating extensibility manifest...");
  try {
    consola.info("Reading extensibility config...");
    const config = await parseExtensibilityConfig();

    consola.info("Generating extensibility manifest...");
    const contents = JSON.stringify(config, null, 2);
    const outputDir = await makeOutputDirFor(
      `${EXTENSION_POINT_FOLDER_PATH}/.generated`,
    );

    const manifestPath = join(outputDir, EXTENSIBILITY_MANIFEST_FILE);
    await writeFile(manifestPath, contents, "utf-8");

    consola.success(`Generated ${EXTENSIBILITY_MANIFEST_FILE}`);
  } catch (error) {
    if (error instanceof Error) {
      consola.fatal(error);
    } else {
      consola.fatal(new Error(stringifyError(error), { cause: error }));
    }
  }
}
