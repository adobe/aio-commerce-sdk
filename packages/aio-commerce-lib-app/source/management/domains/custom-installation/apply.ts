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
  getScriptModuleOrThrow,
  resolveCustomScriptHandler,
} from "./custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type {
  CustomInstallationDomainPlan,
  CustomInstallationSnapshotData,
  CustomInstallationStepIdentity,
} from "./types";

/** Runs a newly-added step's `install` handler and returns its persisted identity. */
async function runAddedStep(
  step: CustomInstallationStep,
  targetConfig: CommerceAppConfigOutputModel,
  context: ApplyContext,
): Promise<CustomInstallationStepIdentity> {
  const { logger } = context;
  const scriptModule = getScriptModuleOrThrow(
    context.customScripts ?? {},
    step.script,
  );

  logger.info(`Executing custom installation script: ${step.name}`);
  const install = resolveCustomScriptHandler(scriptModule, "install");
  await install(targetConfig, context);
  logger.info(`Successfully executed script: ${step.name}`);

  return { name: step.name, script: step.script };
}

/**
 * Applies the plan: runs `install` for first-time steps, warns about retained steps that point to
 * a different script (without re-running them), and ignores steps no longer in the config. Returns
 * the baseline history with the newly-added steps appended.
 */
export async function applyCustomInstallationSteps(
  plan: CustomInstallationDomainPlan,
  context: ApplyContext,
): Promise<ApplyResult<CustomInstallationSnapshotData>> {
  const { baselineExecutedSteps, targetConfig, operations } = plan;

  if (!targetConfig) {
    // No target config: nothing to install. `operations` can only be `remove`s here (the plan
    // only proposes `add`s when a target config with steps exists), so just carry the baseline
    // history forward untouched.
    return { snapshotData: { executedSteps: baselineExecutedSteps } };
  }

  const targetSteps = hasCustomInstallationSteps(targetConfig)
    ? targetConfig.installation.customInstallationSteps
    : [];

  const addedNames = new Set(
    operations.filter((op) => op.kind === "add").map((op) => op.after.name),
  );

  // Retained steps: present in both baseline and target, never re-run. Warn if one now points to
  // a different script than the one that ran, since that change is silently kept.
  for (const targetStep of targetSteps) {
    if (addedNames.has(targetStep.name)) {
      continue;
    }

    const baselineStep = baselineExecutedSteps.find(
      (step) => step.name === targetStep.name,
    );

    if (baselineStep && baselineStep.script !== targetStep.script) {
      context.logger.warn(
        `Custom installation step "${targetStep.name}" now points to a different script ` +
          `("${targetStep.script}" instead of "${baselineStep.script}"). This does not affect ` +
          "append-only behavior: its install already ran and will not run again.",
      );
    }
  }

  const addedSteps = targetSteps.filter((step) => addedNames.has(step.name));
  const addedIdentities: CustomInstallationStepIdentity[] = [];

  for (const step of addedSteps) {
    // biome-ignore lint/performance/noAwaitInLoops: steps run in declared order and may depend on earlier ones
    addedIdentities.push(await runAddedStep(step, targetConfig, context));
  }

  return {
    snapshotData: {
      executedSteps: [...baselineExecutedSteps, ...addedIdentities],
    },
  };
}
