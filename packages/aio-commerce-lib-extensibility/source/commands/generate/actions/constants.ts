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

import {
  EXTENSIBILITY_MANIFEST_FILE,
  GENERATED_ACTIONS_PATH,
  GENERATED_PATH,
  PACKAGE_NAME,
} from "#commands/constants";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";

/** The list of runtime actions to generate */
export const RUNTIME_ACTIONS = [
  {
    name: "get-extensibility-config",
    templateFile: "get-extensibility-config.js.template",
  },
];

/** The ext.config.yaml configuration */
export const EXT_CONFIG: ExtConfig = {
  hooks: {
    "pre-app-build":
      "$packageExec aio-commerce-lib-extensibility generate manifest",
  },

  operations: {
    workerProcess: [
      {
        type: "action",
        impl: `${PACKAGE_NAME}/get-extensibility-config`,
      },
    ],
  },

  runtimeManifest: {
    packages: {
      [PACKAGE_NAME]: {
        license: "Apache-2.0",
        actions: {
          "get-extensibility-config": {
            function: `${GENERATED_ACTIONS_PATH}/get-extensibility-config.js`,
            include: [
              [
                `${GENERATED_PATH}/${EXTENSIBILITY_MANIFEST_FILE}`,
                `${PACKAGE_NAME}/`,
              ],
            ],

            web: "yes",
            runtime: "nodejs:22",
            annotations: {
              "require-adobe-auth": true,
              final: true,
            },
          },
        },
      },
    },
  },
};
