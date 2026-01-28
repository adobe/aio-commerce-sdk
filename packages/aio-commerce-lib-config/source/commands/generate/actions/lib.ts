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
  CONFIG_SCHEMA_FILE_NAME,
  GENERATED_ACTIONS_PATH,
  GENERATED_PATH,
  PACKAGE_NAME,
} from "#commands/constants";

import type { ActionDefinition } from "@aio-commerce-sdk/scripting-utils/yaml/types";

export type ActionConfig = {
  name: string;
  templateFile: string;
  requiresSchema?: boolean;
};

export function buildActionDefinition(action: ActionConfig): ActionDefinition {
  const def: ActionDefinition = {
    function: `${GENERATED_ACTIONS_PATH}/${action.name}.js`,
    web: "yes",
    runtime: "nodejs:22",
    annotations: {
      "require-adobe-auth": true,
      final: true,
    },
  };

  if (action.requiresSchema) {
    def.include = [
      [`${GENERATED_PATH}/${CONFIG_SCHEMA_FILE_NAME}`, `${PACKAGE_NAME}/`],
    ];
  }

  return def;
}
