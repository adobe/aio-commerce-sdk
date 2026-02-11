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

import { GENERATED_ACTIONS_PATH, PACKAGE_NAME } from "#commands/constants";

import type {
  ActionDefinition,
  ExtConfig,
} from "@aio-commerce-sdk/scripting-utils/yaml";

/** The list of Commerce variables that are required for the runtime actions */
export const COMMERCE_VARIABLES = [
  "AIO_COMMERCE_API_BASE_URL",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  "AIO_COMMERCE_AUTH_IMS_ORG_ID",
  "AIO_COMMERCE_AUTH_IMS_SCOPES",
] as const satisfies string[];

/** The inputs for the generated runtime actions */
export const COMMERCE_ACTION_INPUTS = Object.fromEntries(
  COMMERCE_VARIABLES.map((variable) => [variable, `$${variable}`] as const),
);

/** The list of runtime actions to generate */
export const RUNTIME_ACTIONS = [
  {
    name: "get-app-config",
    templateFile: "get-app-config.js.template",
  },
  {
    name: "installation",
    templateFile: "installation.js.template",
  },
];

/**
 * Creates a runtime action configuration.
 * @param actionName - The name of the action.
 * @param options - Optional configuration options.
 */
function createActionConfig(
  actionName: string,
  options: Omit<ActionDefinition, "function"> = {},
) {
  return {
    ...options,

    function: `${GENERATED_ACTIONS_PATH}/${actionName}.js`,
    web: options.web ?? "yes",
    runtime: "nodejs:22",
    annotations: {
      "require-adobe-auth": true,
      final: true,
    },
  };
}

/** The ext.config.yaml configuration */
export const EXT_CONFIG: ExtConfig = {
  hooks: {
    "pre-app-build":
      "$packageExec aio-commerce-lib-app generate manifest && $packageExec aio-commerce-lib-auth sync-ims-credentials",
  },

  operations: {
    workerProcess: [
      {
        type: "action",
        impl: `${PACKAGE_NAME}/get-app-config`,
      },
      {
        type: "action",
        impl: `${PACKAGE_NAME}/installation`,
      },
    ],
  },

  runtimeManifest: {
    packages: {
      [PACKAGE_NAME]: {
        license: "Apache-2.0",
        actions: {
          "get-app-config": createActionConfig("get-app-config"),
          installation: createActionConfig("installation", {
            inputs: { ...COMMERCE_ACTION_INPUTS, LOG_LEVEL: "$LOG_LEVEL" },
            limits: {
              timeout: 600_000,
            },
          }),
        },
      },
    },
  },
};
