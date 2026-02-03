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

/** The list of runtime actions to generate */
export const RUNTIME_ACTIONS: ActionConfig[] = [
  {
    name: "config",
    templateFile: "config.js.template",
    requiresSchema: true,
  },
  {
    name: "scope-tree",
    templateFile: "scope-tree.js.template",
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
