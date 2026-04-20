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
import { syncImsCredentials } from "@aio-commerce-sdk/scripting-utils/env";
import consola from "consola";

import { BACKEND_UI_EXTENSION_POINT_ID } from "#commands/constants";
import { generateRegistrationActionFile } from "#commands/generate/actions/main";
import { run as generateManifestCommand } from "#commands/generate/manifest/main";
import { run as generateSchemaCommand } from "#commands/generate/schema/main";
import { loadAppManifest } from "#commands/utils";
import { hasAdminUiSdk } from "#config/index";

type Extension = "extensibility/1" | "configuration/1" | "backend-ui/1";

/**
 * Runs the pre-app-build hook for the given extension.
 * @param extension - The extension to run the hook for.
 */
export async function run(extension: Extension) {
  const appManifest = await loadAppManifest();

  if (extension === "extensibility/1") {
    await generateManifestCommand(appManifest);

    consola.info("Syncing IMS credentials...");
    await syncImsCredentials();

    return;
  }

  if (extension === "configuration/1") {
    await generateSchemaCommand(appManifest);
    return;
  }

  if (extension === "backend-ui/1") {
    if (hasAdminUiSdk(appManifest)) {
      await generateRegistrationActionFile(
        appManifest,
        BACKEND_UI_EXTENSION_POINT_ID,
      );
    }
    return;
  }

  throw new Error(`Unsupported extension: ${extension}`);
}

/** Runs the pre-app-build hook */
export async function exec() {
  consola.debug("Running lib-app pre-app-build hook");
  const extension = process.env.EXTENSION as Extension;

  try {
    if (!extension) {
      throw new Error("EXTENSION environment variable is not set");
    }

    await run(extension);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    }

    consola.error(error);
    process.exit(1);
  }
}
