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

import { join } from "node:path";

import consola from "consola";
import * as prettier from "prettier";

import { parseCommerceAppConfig } from "#config/index";

import {
  ADMIN_UI_SDK_ACTIONS_PATH,
  APP_MANIFEST_FILE,
  CONFIG_SCHEMA_FILE_NAME,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  GENERATED_ACTIONS_PATH,
  GENERATED_PATH,
  getExtensionPointFolderPath,
} from "./constants";

/** Format file content using prettier, inferring the parser from the file path. */
export function prettierFormat(content: string, filepath: string) {
  return prettier.format(content, {
    semi: true,
    quoteStyle: "double",
    arrowParens: "always",
    bracketSameLine: true,
    bracketSpacing: true,
    trailingComma: "all",
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    filepath,
  });
}

/** Load the app commerce config */
export async function loadAppManifest() {
  // If the config file is invalid or missing, we want to fail early before generating any files
  const appConfig = await parseCommerceAppConfig();
  consola.debug("Loaded app commerce config");

  return appConfig;
}

/**
 * Path to an extension point's `.generated` directory, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 */
export function getGeneratedDir(extensionPointId: string) {
  return join(getExtensionPointFolderPath(extensionPointId), GENERATED_PATH);
}

/**
 * Path to an extension point's generated actions directory, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 */
export function getActionsDir(extensionPointId: string) {
  return join(
    getExtensionPointFolderPath(extensionPointId),
    GENERATED_ACTIONS_PATH,
  );
}

/**
 * Path to a specific generated action file, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 * @param actionName - The name of the action, e.g. "my-action"
 */
export function getActionPath(extensionPointId: string, actionName: string) {
  return join(getActionsDir(extensionPointId), `${actionName}.js`);
}

/**
 * Path to an extension point's `ext.config.yaml`, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 */
export function getExtConfigPath(extensionPointId: string) {
  return join(getExtensionPointFolderPath(extensionPointId), "ext.config.yaml");
}

/**
 * Path to an Admin UI SDK generated actions directory, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/backend-ui/1"
 */
export function getAdminUiSdkActionsDir(extensionPointId: string) {
  return join(
    getExtensionPointFolderPath(extensionPointId),
    ADMIN_UI_SDK_ACTIONS_PATH,
  );
}

/**
 * Path to the generated Admin UI SDK registration action file, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/backend-ui/1"
 */
export function getAdminUiSdkRegistrationActionPath(extensionPointId: string) {
  return join(getAdminUiSdkActionsDir(extensionPointId), "index.js");
}

/** Path to the generated app manifest file, relative to the project root. */
export function getManifestPath() {
  return join(
    getGeneratedDir(EXTENSIBILITY_EXTENSION_POINT_ID),
    APP_MANIFEST_FILE,
  );
}

/** Path to the generated configuration schema file, relative to the project root. */
export function getSchemaPath() {
  return join(
    getGeneratedDir(CONFIGURATION_EXTENSION_POINT_ID),
    CONFIG_SCHEMA_FILE_NAME,
  );
}
