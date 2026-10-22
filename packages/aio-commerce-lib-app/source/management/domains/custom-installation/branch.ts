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

import { hasCustomInstallationSteps } from "#config/schema/installation";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/common/workflow/index";
import { deprecatedReconciliationStep } from "#management/deprecated/domains/custom-installation";

import { applyCustomInstallationSteps } from "./apply";
import {
  createCustomScriptStep,
  createCustomScriptSteps,
  getCustomScriptStepName,
} from "./custom-scripts";
import { planCustomInstallationSteps } from "./plan";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AnyStep } from "#management/common/workflow/index";
import type { CustomInstallationStepIdentity } from "./types";

/**
 * Leaf step that reconciles the custom installation steps domain as a whole via `plan`/`apply`.
 * The per-script leaves only run under the deprecated installation and uninstallation runners.
 */
const reconciliationStep = defineLeafStep({
  ...deprecatedReconciliationStep,
  apply: applyCustomInstallationSteps,

  meta: {
    install: {
      description:
        "Records which custom installation steps ran, so future upgrades can detect additions and removals",
      label: "Reconcile Custom Installation Steps",
    },
    uninstall: {
      description: "Runs the uninstall of custom installation steps that ran",
      label: "Reconcile Custom Installation Steps",
    },
    upgrade: {
      description:
        "Runs custom installation steps added since the last version",
      label: "Reconcile Custom Installation Steps",
    },
  },
  name: "reconciliation",
  plan: planCustomInstallationSteps,
});

/** Root custom installation step that executes custom installation scripts. */
const customInstallationStepBase = defineBranchStep({
  children: [],

  isConfigured: hasCustomInstallationSteps,
  meta: {
    install: {
      description:
        "Executes custom installation scripts defined in the application configuration",
      label: "Custom Installation Steps",
    },
    uninstall: {
      description:
        "Executes custom uninstallation scripts defined in the application configuration",
      label: "Custom Uninstallation Steps",
    },
    upgrade: {
      description:
        "Reconciles custom installation steps added or removed between versions",
      label: "Custom Installation Steps",
    },
  },
  name: "customInstallationSteps",
});

/**
 * Creates the leaf of a custom installation step that ran, with the description the config gives
 * it, or one saying it is no longer configured when the config does not declare it.
 */
function createExecutedScriptStep(
  config: CommerceAppConfigOutputModel,
  identity: CustomInstallationStepIdentity,
): AnyStep {
  const currentStep = hasCustomInstallationSteps(config)
    ? config.installation.customInstallationSteps.find(
        (step) => step.name === identity.name,
      )
    : undefined;

  return createCustomScriptStep(
    currentStep ?? {
      description:
        "Previously executed custom installation step, no longer present in the configuration.",
      name: identity.name,
      script: identity.script,
    },
  );
}

/** Creates the children of the custom installation step (see {@link createCustomInstallationStep}). */
function createChildSteps(
  config: CommerceAppConfigOutputModel,
  executedSteps: readonly CustomInstallationStepIdentity[],
  includeReconciliation: boolean,
): AnyStep[] {
  // The history is append-only, so its order is the real install order; reverse it to
  // uninstall the newest step first.
  const executedStepLeaves = [...executedSteps]
    .reverse()
    .map((identity) => createExecutedScriptStep(config, identity));

  if (includeReconciliation) {
    const executedStepNames = new Set(
      executedSteps.map((step) => getCustomScriptStepName(step.name)),
    );

    return [
      ...executedStepLeaves,
      ...createCustomScriptSteps(config).filter(
        (step) => !executedStepNames.has(step.name),
      ),
      reconciliationStep,
    ];
  }

  return executedSteps.length > 0
    ? executedStepLeaves
    : createCustomScriptSteps(config);
}

/**
 * Creates the custom installation step with dynamic children based on config. `executedSteps` is
 * the recorded run history. `includeReconciliation` builds the tree the lifecycle plans and
 * applies: a leaf per step that ran, newest first, then a leaf per configured step that has not
 * run, in config order, then the reconciliation leaf. The deprecated runners leave it out, and get
 * a leaf per step that ran, newest first, or a leaf per configured step when none ran.
 */
export function createCustomInstallationStep(
  config: CommerceAppConfigOutputModel,
  executedSteps: readonly CustomInstallationStepIdentity[] = [],
  includeReconciliation = false,
) {
  const children = createChildSteps(
    config,
    executedSteps,
    includeReconciliation,
  );

  return {
    ...customInstallationStepBase,
    children,

    // Keep the branch "configured" when there's step history to uninstall, even if the current
    // config has no custom steps; otherwise a full uninstall would never visit these leaves.
    isConfigured: (candidateConfig: CommerceAppConfigOutputModel) =>
      hasCustomInstallationSteps(candidateConfig) || executedSteps.length > 0,
  };
}
