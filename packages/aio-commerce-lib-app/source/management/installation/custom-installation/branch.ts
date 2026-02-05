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
  executeCustomInstallationScripts,
  hasCustomInstallationSteps,
} from "./execute-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationConfig } from "./execute-scripts";

/** Check if config has custom installation steps. */
export function hasCustomInstallation(
  config: CommerceAppConfigOutputModel,
): config is CustomInstallationConfig {
  return hasCustomInstallationSteps(config);
}

/** Root custom installation step that executes custom installation scripts. */
export const customInstallationStep = defineBranchStep({
  name: "custom-installation",
  meta: {
    label: "Custom Installation",
    description:
      "Executes custom installation scripts defined in the application configuration",
  },

  when: hasCustomInstallation,
  children: [executeCustomInstallationScripts],
});
