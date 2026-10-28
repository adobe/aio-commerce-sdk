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
import { defineBranchStep } from "#management/common/workflow/index";

import { applyCustomScript } from "./apply";
import {
  createCustomScriptStep,
  createCustomScriptSteps,
  findDeclaredStep,
} from "./custom-scripts";
import { planCustomScript } from "./plan";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type { AnyStep } from "#management/common/workflow/index";
import type { CustomInstallationStepIdentity, CustomScriptRun } from "./types";

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

/** The step to show for a step that ran but the config no longer declares. */
function toUndeclaredStep(
  identity: CustomInstallationStepIdentity,
): CustomInstallationStep {
  return {
    description:
      "Previously executed custom installation step, no longer present in the configuration.",
    name: identity.name,
    script: identity.script,
  };
}

/**
 * Creates the leaf the lifecycle plans and applies for a single custom installation step.
 *
 * @param step - The step the leaf shows.
 * @param run - What is known about the step, handed to its planner.
 */
function createLifecycleScriptStep(
  step: CustomInstallationStep,
  run: CustomScriptRun,
): AnyStep {
  return {
    ...createCustomScriptStep(step),
    apply: applyCustomScript,
    plan: (input, context) => planCustomScript(run, input, context),
  };
}

/**
 * Creates the children the deprecated runners execute: a leaf per step that ran, or a leaf per
 * configured step when none ran.
 */
function createDeprecatedChildSteps(
  config: CommerceAppConfigOutputModel,
  newestFirst: CustomInstallationStepIdentity[],
): AnyStep[] {
  if (newestFirst.length === 0) {
    return createCustomScriptSteps(config);
  }

  return newestFirst.map((executed) =>
    createCustomScriptStep(
      findDeclaredStep(config, executed.name) ?? toUndeclaredStep(executed),
    ),
  );
}

/**
 * Creates the children the lifecycle plans and applies: a leaf per step that ran, then a leaf per
 * configured step that has not run, in config order.
 */
function createLifecycleChildSteps(
  config: CommerceAppConfigOutputModel,
  newestFirst: CustomInstallationStepIdentity[],
  isHistoryStored: boolean,
): AnyStep[] {
  const ranSteps = newestFirst.map((executed) => {
    const declared = findDeclaredStep(config, executed.name) ?? null;
    return createLifecycleScriptStep(declared ?? toUndeclaredStep(executed), {
      declared,
      executed,
      isHistoryStored,
    });
  });

  const ranNames = new Set(newestFirst.map((executed) => executed.name));
  const declaredSteps = hasCustomInstallationSteps(config)
    ? config.installation.customInstallationSteps
    : [];

  const notRunSteps = declaredSteps
    .filter((declared) => !ranNames.has(declared.name))
    .map((declared) =>
      createLifecycleScriptStep(declared, {
        declared,
        executed: null,
        isHistoryStored,
      }),
    );

  return [...ranSteps, ...notRunSteps];
}

/**
 * Creates the custom installation step with dynamic children based on config. `executedSteps` is
 * the recorded run history, or `null` when none is stored. `forLifecycle` builds the tree the
 * lifecycle plans and applies, where each leaf plans and applies only its own step. The
 * deprecated runners leave it out.
 */
export function createCustomInstallationStep(
  config: CommerceAppConfigOutputModel,
  executedSteps: readonly CustomInstallationStepIdentity[] | null = [],
  forLifecycle = false,
) {
  // The history is append-only, so its order is the real install order; reverse it to
  // uninstall the newest step first.
  const newestFirst = [...(executedSteps ?? [])].reverse();

  const children = forLifecycle
    ? createLifecycleChildSteps(config, newestFirst, executedSteps !== null)
    : createDeprecatedChildSteps(config, newestFirst);

  return {
    ...customInstallationStepBase,
    children,

    // Keep the branch "configured" when there's step history, even if the current config has no
    // custom steps; otherwise planning would never visit these leaves.
    isConfigured: (candidateConfig: CommerceAppConfigOutputModel) =>
      hasCustomInstallationSteps(candidateConfig) || newestFirst.length > 0,
  };
}
