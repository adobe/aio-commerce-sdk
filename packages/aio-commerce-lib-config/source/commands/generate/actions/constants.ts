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

import { PACKAGE_NAME } from "#commands/constants";

import { buildActionDefinition } from "./lib";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml/types";
import type { ActionConfig } from "./lib";

/** The list of Commerce variables that are required for the runtime actions */
export const COMMERCE_VARIABLES = [
  "AIO_COMMERCE_API_BASE_URL",
  "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY",
  "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET",
  "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN",
  "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  "AIO_COMMERCE_AUTH_IMS_ORG_ID",
  "AIO_COMMERCE_AUTH_IMS_SCOPES",
] as const satisfies string[];

/** The inputs for the generated runtime actions */
export const ACTION_INPUTS = Object.fromEntries(
  COMMERCE_VARIABLES.map((variable) => [variable, `$${variable}`] as const),
);

/** The list of runtime actions to generate */
export const RUNTIME_ACTIONS: ActionConfig[] = [
  {
    name: "get-scope-tree",
    templateFile: "get-scope-tree.js.template",
  },
  {
    name: "get-config-schema",
    templateFile: "get-config-schema.js.template",
    requiresSchema: true,
  },
  {
    name: "get-configuration",
    templateFile: "get-configuration.js.template",
    requiresSchema: true,
  },
  {
    name: "set-configuration",
    templateFile: "set-configuration.js.template",
  },
  {
    name: "set-custom-scope-tree",
    templateFile: "set-custom-scope-tree.js.template",
  },
  {
    name: "sync-commerce-scopes",
    templateFile: "sync-commerce-scopes.js.template",
    requiresCommerce: true,
  },
  {
    name: "unsync-commerce-scopes",
    templateFile: "unsync-commerce-scopes.js.template",
  },
];

export const EXT_CONFIG: ExtConfig = {
  hooks: {
    "pre-app-build": "$packageExec aio-commerce-lib-config generate schema",
  },

  operations: {
    workerProcess: RUNTIME_ACTIONS.map((action) => ({
      type: "action",
      impl: `${PACKAGE_NAME}/${action.name}`,
    })),
  },

  runtimeManifest: {
    packages: {
      [PACKAGE_NAME]: {
        license: "Apache-2.0",
        actions: Object.fromEntries(
          RUNTIME_ACTIONS.map((action) => [
            action.name,
            buildActionDefinition(action),
          ]),
        ),
      },
    },
  },
};
