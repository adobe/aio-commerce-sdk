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

import { applyCustomInstallationSteps } from "./apply";
import {
  createCustomScriptStep,
  createCustomScriptSteps,
} from "./custom-scripts";
import { planCustomInstallationSteps } from "./plan";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStepIdentity } from "./types";

/**
 * Leaf step that plans and runs every custom installation script at once, through `plan`/`apply`.
 * The lifecycle only runs leaves that have a `plan`, and the per-script leaves don't, so lifecycle
 * trees need this leaf. The legacy runner runs the per-script leaves itself and leaves it out.
 */
const reconciliationStep = defineLeafStep({
  apply: applyCustomInstallationSteps,

  // `LeafStep` requires an `install`, but this leaf only runs through `plan`/`apply`: the legacy
  // runner leaves it out of its tree.
  install: () => {
    throw new Error(
      "The custom installation steps reconciliation leaf only runs through plan/apply",
    );
  },

  meta: {
    install: {
      description:
        "Records which custom installation steps ran, so future upgrades can detect additions and removals",
      label: "Reconcile Custom Installation Steps",
    },
    uninstall: {
      description: "Runs the uninstall handler of every executed custom step",
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
 * Creates the custom installation steps branch, with one leaf per configured script.
 *
 * @param config - The configuration that lists the scripts.
 * @param executedSteps - The recorded run history. Only passed when building the full-uninstall tree.
 * @param includeReconciliation - Adds the leaf that runs every script through `plan`/`apply`
 * (see `reconciliationStep`). Set it for trees the lifecycle runs; leave it off for the legacy
 * runner, which runs the per-script leaves.
 */
export function createCustomInstallationStep(
  config: CommerceAppConfigOutputModel,
  executedSteps: readonly CustomInstallationStepIdentity[] = [],
  includeReconciliation = false,
) {
  const children =
    executedSteps.length > 0
      ? // The history is append-only, so its order is the real install order; reverse it to
        // uninstall the newest step first.
        [...executedSteps].reverse().map((identity) => {
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
        })
      : [
          ...createCustomScriptSteps(config),
          ...(includeReconciliation ? [reconciliationStep] : []),
        ];

  return {
    ...customInstallationStepBase,
    children,

    // Keep the branch "configured" when there's step history to uninstall, even if the current
    // config has no custom steps; otherwise a full uninstall would never visit these leaves.
    isConfigured: (candidateConfig: CommerceAppConfigOutputModel) =>
      hasCustomInstallationSteps(candidateConfig) || executedSteps.length > 0,
  };
}
