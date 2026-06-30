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

// These are injected and replaced at build/test time.
declare const __LIB_ADMIN_UI_RANGE__: string;
declare const __REACT_VERSION__: string;
declare const __REACT_DOM_VERSION__: string;
declare const __REACT_TYPES_VERSION__: string;
declare const __SPECTRUM_S2_VERSION__: string;

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

/** File extensions that require bundling or TypeScript web-src templates. */
export const TYPESCRIPT_CONFIG_EXTENSIONS = new Set([".ts", ".mts", ".cts"]);

/** Default generated web-src entrypoint referenced by the HTML template. */
export const WEB_SOURCE_ENTRYPOINT = "./src/app.jsx";

/** Runtime dependencies required by the generated web-src app. */
export const WEB_SOURCE_DEPENDENCIES = [
  {
    name: "@adobe/aio-commerce-lib-admin-ui",
    version: __LIB_ADMIN_UI_RANGE__,
  },
  { name: "react", version: __REACT_VERSION__ },
  { name: "react-dom", version: __REACT_DOM_VERSION__ },
  { name: "@react-spectrum/s2", version: __SPECTRUM_S2_VERSION__ },
] as const;

/** Development dependencies required by the generated web-src app. */
export const WEB_SOURCE_DEV_DEPENDENCIES = [
  { name: "@types/react", version: __REACT_TYPES_VERSION__ },
] as const;

/** Parcel shared bundle config required by Spectrum S2 styles. */
export const WEB_SOURCE_SHARED_BUNDLES = [
  {
    assets: [
      "**/@react-spectrum/s2/**",
      "src/commerce-backend-ui-2/web-src/*.{js,jsx,ts,tsx}",
    ],
    name: "s2-styles",
    types: ["css"],
  },
];
