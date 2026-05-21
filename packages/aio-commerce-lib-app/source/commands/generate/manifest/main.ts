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

import { access, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  getProjectRootDirectory,
  makeOutputDirFor,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";
import { stringify } from "safe-stable-stringify";

import {
  APP_MANIFEST_FILE,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import {
  getGeneratedDir,
  getManifestPath,
  hasDynamicAppConfig,
  loadAppManifest,
} from "#commands/utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

export async function run(appConfig: CommerceAppConfigOutputModel) {
  // When the business config schema is dynamic, factory functions can't be
  // JSON-serialized; generated actions read the config from the runtime ESM
  // module instead. Remove any stale JSON from a previous static run.
  if (hasDynamicAppConfig(appConfig)) {
    const stalePath = join(await getProjectRootDirectory(), getManifestPath());
    const staleExists = await access(stalePath).then(
      () => true,
      () => false,
    );

    if (staleExists) {
      await rm(stalePath, { force: true });
      consola.success(`Removed stale ${APP_MANIFEST_FILE}`);
    }

    return;
  }

  consola.info("Generating app manifest...");

  const contents = stringify(appConfig, null, 2);
  const outputDir = await makeOutputDirFor(
    getGeneratedDir(EXTENSIBILITY_EXTENSION_POINT_ID),
  );

  const manifestPath = join(outputDir, APP_MANIFEST_FILE);
  await writeFile(manifestPath, contents, "utf-8");

  consola.success(`Generated ${APP_MANIFEST_FILE}\n`);
}

/** Run the generate manifest command */
export async function exec() {
  try {
    const config = await loadAppManifest();
    await run(config);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}
