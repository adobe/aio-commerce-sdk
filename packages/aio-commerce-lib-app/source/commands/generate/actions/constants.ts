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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** The path to the action templates directory, sibling to this file. */
export const TEMPLATES_DIR = join(__dirname, "templates");

/** The list of Commerce variables that are required for the runtime actions. */
export const COMMERCE_VARIABLES = [
  "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  "AIO_COMMERCE_AUTH_IMS_ORG_ID",
  "AIO_COMMERCE_AUTH_IMS_SCOPES",
] as const satisfies string[];

/** The inputs for the generated runtime actions. */
export const COMMERCE_ACTION_INPUTS = Object.fromEntries(
  COMMERCE_VARIABLES.map((variable) => [variable, `$${variable}`] as const),
);

export const CUSTOM_IMPORTS_PLACEHOLDER = "// {{CUSTOM_SCRIPTS_IMPORTS}}";
export const CUSTOM_SCRIPTS_MAP_PLACEHOLDER = "// {{CUSTOM_SCRIPTS_MAP}}";
export const CUSTOM_SCRIPTS_LOADER_PLACEHOLDER = "// {{CUSTOM_SCRIPTS_LOADER}}";
