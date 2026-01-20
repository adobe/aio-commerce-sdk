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

/** The list of runtime actions to generate */
export const RUNTIME_ACTIONS = [
  {
    name: "get-app-config",
    templateFile: "get-app-config.js.template",
  },
  {
    name: "install-app",
    templateFile: "install-app.js.template",
  },
];

/**
 * Creates a runtime action configuration
 * @param actionName - The name of the action
 * @returns The action configuration object
 */
function createActionConfig(actionName: string): ActionDefinition {
  return {
    function: `${GENERATED_ACTIONS_PATH}/${actionName}.js`,
    web: "yes",
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
    "pre-app-build": "$packageExec aio-commerce-lib-app generate manifest",
  },

  operations: {
    workerProcess: [
      {
        type: "action",
        impl: `${PACKAGE_NAME}/get-app-config`,
      },
      {
        type: "action",
        impl: `${PACKAGE_NAME}/install`,
      },
    ],
  },

  runtimeManifest: {
    packages: {
      [PACKAGE_NAME]: {
        license: "Apache-2.0",
        actions: {
          "get-app-config": createActionConfig("get-app-config"),
          install: createActionConfig("install"),
        },
      },
    },
  },
};
