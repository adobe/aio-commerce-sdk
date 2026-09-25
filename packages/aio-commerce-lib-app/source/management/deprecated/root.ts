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

import { defineBranchStep } from "#management/common/workflow/index";
import { createDefaultChildSteps } from "#management/installation/root";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { BranchStep } from "#management/common/workflow/index";
import type { CustomInstallationStepIdentity } from "#management/domains/custom-installation/index";

/**
 * Creates a root uninstallation step with dynamic children based on the config.
 *
 * `executedCustomInstallationSteps` is the persisted history of every custom installation step
 * that ever ran (from the lifecycle baseline snapshot). Passing it lets a full unassociate reach
 * steps that ran in a previous version but were since removed from the config.
 */
export function createRootUninstallationStep(
  config: CommerceAppConfigOutputModel,
  executedCustomInstallationSteps: readonly CustomInstallationStepIdentity[] = [],
): BranchStep {
  return defineBranchStep({
    children: createDefaultChildSteps(config, executedCustomInstallationSteps),
    meta: {
      install: {
        description: "App uninstallation workflow",
        label: "Uninstallation",
      },
    },
    name: "uninstallation",
  });
}
