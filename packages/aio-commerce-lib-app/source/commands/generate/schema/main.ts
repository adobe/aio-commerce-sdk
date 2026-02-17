/*
 * Copyright 2026 Adobe. All rights reserved.
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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { makeOutputDirFor } from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";

import {
  CONFIG_SCHEMA_FILE_NAME,
  CONFIGURATION_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { loadAppManifest } from "#commands/utils";
import { hasBusinessConfigSchema } from "#config/index";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

export async function run(appConfig: CommerceAppConfigOutputModel) {
  consola.info("Generating configuration schema...");

  if (!hasBusinessConfigSchema(appConfig)) {
    consola.warn("Business configuration schema not found");
    return;
  }

  // TODO: Remove validation command from lib-config once we split encryption setup.
  execSync("aio-commerce-lib-config schema validate");

  const contents = JSON.stringify(appConfig.businessConfig.schema, null, 2);
  const outputDir = await makeOutputDirFor(
    `${getExtensionPointFolderPath(CONFIGURATION_EXTENSION_POINT_ID)}/.generated`,
  );

  const manifestPath = join(outputDir, CONFIG_SCHEMA_FILE_NAME);
  await writeFile(manifestPath, contents, "utf-8");

  consola.success(`Generated ${CONFIG_SCHEMA_FILE_NAME}`);
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
