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

/** The name of the package containing all the generated runtime actions */
export const PACKAGE_NAME = "app-management";

/** The path to the directory containing the generated files */
export const GENERATED_PATH = ".generated";

/** The folder name containing the runtime actions */
export const ACTIONS_FOLDER = `actions/${PACKAGE_NAME}`;

/** The path to the directory containing the generated actions */
export const GENERATED_ACTIONS_PATH = `${GENERATED_PATH}/${ACTIONS_FOLDER}`;

/** The name of the extension point for extensibility. */
export const EXTENSIBILITY_EXTENSION_POINT_ID = "commerce/extensibility/1";

/** The name of the extension point for configuration. */
export const CONFIGURATION_EXTENSION_POINT_ID = "commerce/configuration/1";

/** The name of the configuration schema file */
export const APP_MANIFEST_FILE = "app.commerce.manifest.json";

/** The name of the commerce app configuration file */
export const COMMERCE_APP_CONFIG_FILE = "app.commerce.config";

/** The name of the configuration schema file */
export const CONFIG_SCHEMA_FILE_NAME = "configuration-schema.json";

/** The name of the project package file */
export const PACKAGE_JSON_FILE = "package.json";

/** The name of the app configuration file */
export const APP_CONFIG_FILE = "app.config.yaml";

/** The name of the install configuration file */
export const INSTALL_YAML_FILE = "install.yaml";

/** Get the path to the extension point folder */
export function getExtensionPointFolderPath(extensionPointId: string) {
  return `src/${extensionPointId.replaceAll("/", "-")}`;
}
