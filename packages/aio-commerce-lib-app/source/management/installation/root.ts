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
import { adminUiStep } from "#management/domains/admin-ui/index";
import { createCustomInstallationStep } from "#management/domains/custom-installation/index";
import { eventingStep } from "#management/domains/events/index";
import { webhooksStep } from "#management/domains/webhooks/index";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AnyStep, BranchStep } from "#management/common/workflow/index";
import type { CustomInstallationStepIdentity } from "#management/domains/custom-installation/index";

/**
 * Creates the default child steps built-in in the library with dynamic children based on the
 * config. `executedCustomInstallationSteps` is only meaningful for a full uninstall (see
 * {@link createRootUninstallationStep}).
 */
function createDefaultChildSteps(
  config: CommerceAppConfigOutputModel,
  executedCustomInstallationSteps: readonly CustomInstallationStepIdentity[] = [],
): AnyStep[] {
  return [
    eventingStep,
    webhooksStep,
    adminUiStep,
    createCustomInstallationStep(config, executedCustomInstallationSteps),
  ];
}

/**
 * Creates a root installation step with dynamic children based on the config.
 */
export function createRootInstallationStep(
  config: CommerceAppConfigOutputModel,
): BranchStep {
  return defineBranchStep({
    children: createDefaultChildSteps(config),
    meta: {
      install: {
        description: "App installation workflow",
        label: "Installation",
      },
      uninstall: {
        description: "App uninstallation workflow",
        label: "Uninstallation",
      },
      upgrade: {
        description: "App upgrade workflow",
        label: "Upgrade",
      },
    },
    name: "installation",
  });
}

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
