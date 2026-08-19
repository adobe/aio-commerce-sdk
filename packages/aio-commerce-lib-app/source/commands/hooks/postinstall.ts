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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

import { run as generateActions } from "#commands/generate/actions/main";
import { run as generateManifest } from "#commands/generate/manifest/main";
import { run as generateSchema } from "#commands/generate/schema/main";
import { loadAppManifest } from "#commands/utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

export async function run(
  appManifest: CommerceAppConfigOutputModel,
  projectRoot: string,
  templatesDir?: string,
) {
  await generateActions(appManifest, projectRoot, templatesDir);
  await generateManifest(appManifest, projectRoot);
  await generateSchema(appManifest, projectRoot);
}

/** Runs the postinstall hook */
export async function exec() {
  consola.debug("Running lib-app postinstall hook");
  try {
    const projectRoot = await getProjectRootDirectory();
    const appManifest = await loadAppManifest(projectRoot);
    await run(appManifest, projectRoot);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}
