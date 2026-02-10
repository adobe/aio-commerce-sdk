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

import { defineBranchStep } from "../workflow";
import {
  createCustomScriptSteps,
  hasCustomInstallationSteps,
} from "./custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationConfig } from "./custom-scripts";

/** Check if config has custom installation steps. */
export function hasCustomInstallation(
  config: CommerceAppConfigOutputModel,
): config is CustomInstallationConfig {
  return hasCustomInstallationSteps(config);
}

/** Root custom installation step that executes custom installation scripts. */
const customInstallationStepBase = defineBranchStep({
  name: "Custom Installation Steps",
  meta: {
    label: "Custom Installation Steps",
    description:
      "Executes custom installation scripts defined in the application configuration",
  },

  when: hasCustomInstallation,
  children: [],
});

/**
 * Creates the custom installation step with dynamic children based on config.
 * Each custom script becomes a direct child step.
 */
export function createCustomInstallationStep(
  config: CommerceAppConfigOutputModel,
) {
  return {
    ...customInstallationStepBase,
    children: createCustomScriptSteps(config),
  };
}
