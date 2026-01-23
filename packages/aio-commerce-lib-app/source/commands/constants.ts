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

/** The name of the extension point id. */
export const EXTENSION_POINT_ID = "commerce/extensibility/1";

/** The folder name of the extension point. */
export const EXTENSION_POINT_FOLDER_NAME = EXTENSION_POINT_ID.replaceAll(
  "/",
  "-",
);

/** The path to the directory containing the extension point folder */
export const EXTENSION_POINT_FOLDER_PATH = `src/${EXTENSION_POINT_FOLDER_NAME}`;

/** The name of the configuration schema file */
export const APP_MANIFEST_FILE = "app.commerce.manifest.json";

/** The name of the project package file */
export const PACKAGE_JSON_FILE = "package.json";
