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
  TEMPLATES_DIR,
  updateExtConfig,
} from "./lib";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/**
 * Runs the generate actions command for the given extension point.
 * @param appManifest - The app manifest, used to determine which actions to generate and their content.
 * @param templatesDir - The directory to load templates from, for testing purposes. Defaults to the generated actions template root.
 */
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
