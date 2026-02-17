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
import consola from "consola";

import { run as generateActionsCommand } from "#commands/generate/actions/main";
import { run as generateManifestCommand } from "#commands/generate/manifest/main";
import { run as generateSchemaCommand } from "#commands/generate/schema/main";
import { loadAppManifest } from "#commands/utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

async function run(appManifest: CommerceAppConfigOutputModel) {
  await generateActionsCommand(appManifest);
  await generateManifestCommand(appManifest);
  await generateSchemaCommand(appManifest);
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
    }

    consola.error(error);
    process.exit(1);
  }
}
