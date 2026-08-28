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
import type {
  CustomInstallationSnapshotData,
  CustomInstallationStepIdentity,
} from "./types";

/**
 * Leaf step that reconciles the custom installation steps domain as a whole: `plan`/`apply` on an
 * upgrade, and on a fresh install recording which steps ran so the first upgrade has a baseline to
 * diff against.
 */
const reconciliationStep = defineLeafStep({
  apply: applyCustomInstallationSteps,

  // Each per-script leaf already ran its own `install` earlier in this same fresh install; this
  // just records their identity (name/script) for future upgrades to diff against.
  install: (
    config: CommerceAppConfigOutputModel,
  ): CustomInstallationSnapshotData => {
    if (!hasCustomInstallationSteps(config)) {
      return { executedSteps: [] };
    }

    const executedSteps: CustomInstallationStepIdentity[] =
      config.installation.customInstallationSteps.map((step) => ({
        name: step.name,
        script: step.script,
      }));

    return { executedSteps };
  },

  meta: {
    install: {
      description:
        "Records which custom installation steps ran, so future upgrades can detect additions and removals",
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
 * Creates the custom installation step with dynamic children based on config. `executedSteps` is
 * the recorded run history and is only passed when building the full-uninstall tree; when empty,
 * the tree is built from the config's current steps plus the reconciliation leaf.
 */
export function createCustomInstallationStep(
  config: CommerceAppConfigOutputModel,
  executedSteps: readonly CustomInstallationStepIdentity[] = [],
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
      : [...createCustomScriptSteps(config), reconciliationStep];

  return {
    ...customInstallationStepBase,
    children,

    // Keep the branch "configured" when there's step history to uninstall, even if the current
    // config has no custom steps; otherwise a full uninstall would never visit these leaves.
    isConfigured: (candidateConfig: CommerceAppConfigOutputModel) =>
      hasCustomInstallationSteps(candidateConfig) || executedSteps.length > 0,
  };
}
