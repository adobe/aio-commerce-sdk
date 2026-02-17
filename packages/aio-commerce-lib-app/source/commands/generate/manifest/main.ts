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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { makeOutputDirFor } from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";
import { stringify } from "safe-stable-stringify";

import {
  APP_MANIFEST_FILE,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { loadAppManifest } from "#commands/utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

export async function run(appConfig: CommerceAppConfigOutputModel) {
  consola.info("Generating app manifest...");

  const contents = stringify(appConfig, null, 2);
  const outputDir = await makeOutputDirFor(
    `${getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID)}/.generated`,
  );

  const manifestPath = join(outputDir, APP_MANIFEST_FILE);
  await writeFile(manifestPath, contents, "utf-8");

  consola.success(`Generated ${APP_MANIFEST_FILE}`);
}

/** Run the generate manifest command */
export async function exec() {
  try {
    const config = await loadAppManifest();
    await run(config);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    }

    consola.error(error);
    process.exit(1);
  }
}
