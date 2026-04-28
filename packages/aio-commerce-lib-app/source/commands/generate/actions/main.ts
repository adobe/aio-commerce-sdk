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

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { consola } from "consola";

import {
  BACKEND_UI_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import { loadAppManifest } from "#commands/utils";
import { hasAdminUiSdk, hasBusinessConfigSchema } from "#config/index";

import { getRuntimeActions } from "./config";
import {
  generateActionFiles,
  generateRegistrationActionFile,
  updateExtConfig,
} from "./lib";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** The path to the action templates directory, sibling to this file. */
const TEMPLATES_DIR = join(__dirname, "templates");

export async function run(
  appManifest: CommerceAppConfigOutputModel,
  templatesDir = TEMPLATES_DIR,
) {
  const appManagementExtConfig = await updateExtConfig(
    appManifest,
    EXTENSIBILITY_EXTENSION_POINT_ID,
  );

  await generateActionFiles(
    appManifest,
    getRuntimeActions(appManagementExtConfig, "app-management"),
    EXTENSIBILITY_EXTENSION_POINT_ID,
    templatesDir,
  );

  // If the app has a business configuration schema, generate the business configuration actions and files
  if (hasBusinessConfigSchema(appManifest)) {
    const businessConfigExtConfig = await updateExtConfig(
      appManifest,
      CONFIGURATION_EXTENSION_POINT_ID,
    );

    await generateActionFiles(
      appManifest,
      getRuntimeActions(businessConfigExtConfig, "business-configuration"),
      CONFIGURATION_EXTENSION_POINT_ID,
      templatesDir,
    );
  }

  // Phase 3 — Admin UI SDK backend-ui extension point
  if (hasAdminUiSdk(appManifest)) {
    await updateExtConfig(appManifest, BACKEND_UI_EXTENSION_POINT_ID);
    await generateRegistrationActionFile(
      appManifest,
      BACKEND_UI_EXTENSION_POINT_ID,
      templatesDir,
    );
  }
}

/** Run the generate actions command */
export async function exec() {
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

export {
  applyCustomScripts,
  generateCustomScriptsTemplate,
  generateRegistrationActionFile,
} from "./lib";
