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

import {
  setNodeEnv,
  syncImsCredentials,
} from "@aio-commerce-sdk/scripting-utils/env";
import consola from "consola";

import {
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import { getRuntimeActions } from "#commands/generate/actions/config";
import { TEMPLATES_DIR } from "#commands/generate/actions/constants";
import {
  generateActionFiles,
  prepareRuntimeAppConfigModule,
  readExtConfig,
  updateExtConfig,
} from "#commands/generate/actions/lib";
import { run as generateManifest } from "#commands/generate/manifest/main";
import { run as generateSchema } from "#commands/generate/schema/main";
import {
  generateWebSrc,
  prepareWebSourceImportAlias,
} from "#commands/generate/web-src";
import { loadAppManifest } from "#commands/utils";
import { hasBackendUiV2Components } from "#config/index";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml/types";

/** The extensions that register a `pre-app-build` hook. */
export type Extension = "extensibility/1" | "configuration/1" | "backend-ui/2";

/**
 * Runs the pre-app-build hook for the given extension.
 * @param extension - The extension to run the hook for.
 * @param projectRoot - Resolved project root containing extension files.
 * @param templatesDir - Directory containing action templates.
 * @param options - Hook options.
 * @param options.isDevSession - Whether the build runs within `aio app run` or `aio app dev`, which keeps `NODE_ENV` untouched.
 */
export async function run(
  extension: Extension,
  projectRoot: string,
  templatesDir = TEMPLATES_DIR,
  { isDevSession = false } = {},
) {
  const appManifest = await loadAppManifest(projectRoot);
  await prepareRuntimeAppConfigModule(appManifest, projectRoot);

  if (extension === "extensibility/1") {
    const { doc: extensibilityExtConfig } = await readExtConfig(
      EXTENSIBILITY_EXTENSION_POINT_ID,
      projectRoot,
    );

    await generateManifest(appManifest, projectRoot);
    await generateActionFiles(
      appManifest,
      getRuntimeActions(
        extensibilityExtConfig.toJS() as ExtConfig,
        "app-management",
      ),
      EXTENSIBILITY_EXTENSION_POINT_ID,
      templatesDir,
      projectRoot,
    );

    consola.info("Syncing IMS credentials...");
    await syncImsCredentials(projectRoot);

    return;
  }

  if (extension === "configuration/1") {
    const { doc: businessConfigExtConfig } = await readExtConfig(
      CONFIGURATION_EXTENSION_POINT_ID,
      projectRoot,
    );

    await generateSchema(appManifest, projectRoot);
    await generateActionFiles(
      appManifest,
      getRuntimeActions(
        businessConfigExtConfig.toJS() as ExtConfig,
        "business-configuration",
      ),
      CONFIGURATION_EXTENSION_POINT_ID,
      templatesDir,
      projectRoot,
    );

    return;
  }

  if (extension === "backend-ui/2") {
    if (hasBackendUiV2Components(appManifest)) {
      const extConfig = await updateExtConfig(
        appManifest,
        BACKEND_UI_V2_EXTENSION_POINT_ID,
        projectRoot,
      );

      if (extConfig.operations?.view) {
        await prepareWebSourceImportAlias(extConfig, projectRoot);
        await generateWebSrc(
          extConfig,
          appManifest.metadata.displayName,
          projectRoot,
          templatesDir,
        );

        if (!isDevSession) {
          // Ship React's production build for the deployed web bundle.
          await setNodeEnv("production", projectRoot);
        }
      }
    }
    return;
  }

  throw new Error(`Unsupported extension: ${extension}`);
}
