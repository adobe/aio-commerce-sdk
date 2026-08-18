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

import { run as generateActionsCommand } from "#commands/generate/actions/main";
import { run as generateManifestCommand } from "#commands/generate/manifest/main";
import { run as generateSchemaCommand } from "#commands/generate/schema/main";
import { loadAppManifest } from "#commands/utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Options for the postinstall hook. */
export type PostinstallOptions = {
  /** Working directory to resolve the project root from. Defaults to the CWD. */
  cwd?: string;
  /** The directory to load templates from, for testing purposes. Defaults to the generated actions template root. */
  templatesDir?: string;
};

export async function run(
  appManifest: CommerceAppConfigOutputModel,
  { cwd = process.cwd(), templatesDir }: PostinstallOptions = {},
) {
  const projectRoot = await getProjectRootDirectory(cwd);
  await generateActionsCommand(appManifest, { cwd: projectRoot, templatesDir });
  await generateManifestCommand(appManifest, projectRoot);
  await generateSchemaCommand(appManifest, projectRoot);
}

/** Runs the postinstall hook */
export async function exec() {
  consola.debug("Running lib-app postinstall hook");
  try {
    const appManifest = await loadAppManifest();
    await run(appManifest);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}
