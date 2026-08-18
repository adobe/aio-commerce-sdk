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
import {
  setNodeEnv,
  syncImsCredentials,
} from "@aio-commerce-sdk/scripting-utils/env";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
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
import { run as generateManifestCommand } from "#commands/generate/manifest/main";
import { run as generateSchemaCommand } from "#commands/generate/schema/main";
import {
  generateWebSrc,
  prepareWebSourceImportAlias,
} from "#commands/generate/web-src";
import { loadAppManifest } from "#commands/utils";
import { hasAdminUi } from "#config/index";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml/types";

type Extension = "extensibility/1" | "configuration/1" | "backend-ui/2";

/** Options for the pre-app-build hook. */
export type PreAppBuildOptions = {
  /** Working directory to resolve the project root from. Defaults to the CWD. */
  cwd?: string;
  /** The directory to load templates from, for testing purposes. Defaults to the generated actions template root. */
  templatesDir?: string;
};

/**
 * Runs the pre-app-build hook for the given extension.
 * @param extension - The extension to run the hook for.
 * @param options - Working directory and templates directory overrides.
 */
export async function run(
  extension: Extension,
  {
    cwd = process.cwd(),
    templatesDir = TEMPLATES_DIR,
  }: PreAppBuildOptions = {},
) {
  const projectRoot = await getProjectRootDirectory(cwd);
  const appManifest = await loadAppManifest(projectRoot);
  await prepareRuntimeAppConfigModule(appManifest, projectRoot);

  if (extension === "extensibility/1") {
    const { doc: extensibilityExtConfig } = await readExtConfig(
      EXTENSIBILITY_EXTENSION_POINT_ID,
      projectRoot,
    );

    await generateManifestCommand(appManifest, projectRoot);
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

    await generateSchemaCommand(appManifest, projectRoot);
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
    if (hasAdminUi(appManifest)) {
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
          templatesDir,
          projectRoot,
        );

        // Ship React's production build for the deployed web bundle.
        await setNodeEnv("production", projectRoot);
      }
    }
    return;
  }

  throw new Error(`Unsupported extension: ${extension}`);
}

/** Runs the pre-app-build hook */
export async function exec() {
  consola.debug("Running lib-app pre-app-build hook");
  const rawExtension = process.env.EXTENSION;

  try {
    if (!rawExtension) {
      throw new Error("EXTENSION environment variable is not set");
    }

    await run(rawExtension as Extension);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}
