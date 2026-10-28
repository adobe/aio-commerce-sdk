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
 * config. `executedCustomInstallationSteps` is the custom installation steps that ran, or `null`
 * when no run history is stored. `forLifecycle` builds the tree the lifecycle plans and applies
 * (see `createCustomInstallationStep`).
 */
export function createDefaultChildSteps(
  config: CommerceAppConfigOutputModel,
  executedCustomInstallationSteps:
    | readonly CustomInstallationStepIdentity[]
    | null = [],
  forLifecycle = false,
): AnyStep[] {
  return [
    eventingStep,
    webhooksStep,
    adminUiStep,
    createCustomInstallationStep(
      config,
      executedCustomInstallationSteps,
      forLifecycle,
    ),
  ];
}

/**
 * Creates a root installation step with dynamic children based on the config. `forLifecycle`
 * builds the tree the lifecycle plans and applies, with `executedCustomInstallationSteps` as the
 * custom installation steps that ran, or `null` when no run history is stored.
 */
export function createRootInstallationStep(
  config: CommerceAppConfigOutputModel,
  {
    executedCustomInstallationSteps = [],
    forLifecycle = false,
  }: {
    executedCustomInstallationSteps?:
      | readonly CustomInstallationStepIdentity[]
      | null;
    forLifecycle?: boolean;
  } = {},
): BranchStep {
  return defineBranchStep({
    children: createDefaultChildSteps(
      config,
      executedCustomInstallationSteps,
      forLifecycle,
    ),
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
