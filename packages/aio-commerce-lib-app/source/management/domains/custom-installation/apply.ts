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

import {
  getScriptModule,
  getScriptModuleOrThrow,
  resolveCustomScriptHandler,
} from "./custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type {
  CustomInstallationStepIdentity,
  CustomScriptDomainPlan,
} from "./types";

/** Runs a newly-added step's `install` handler and returns its persisted identity. */
async function runAddedStep(
  step: CustomInstallationStepIdentity,
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
 * Runs the `uninstall` of a step that ran before. Returns whether it ran: a step whose script is
 * not deployed, or that exports no `uninstall`, is skipped with a warning.
 */
async function runRemovedStep(
  step: CustomInstallationStepIdentity,
  baselineConfig: CommerceAppConfigOutputModel,
  context: ApplyContext,
): Promise<boolean> {
  const { logger } = context;
  const scriptModule = getScriptModule(
    context.customScripts ?? {},
    step.script,
  );

  if (!scriptModule) {
    logger.warn(
      `Skipping the uninstall of custom installation step "${step.name}": its script "${step.script}" is not deployed.`,
    );
    return false;
  }

  const uninstall = resolveCustomScriptHandler(scriptModule, "uninstall");
  if (!uninstall) {
    logger.warn(
      `Skipping the uninstall of custom installation step "${step.name}": its script exports no uninstall function.`,
    );
    return false;
  }

  logger.info(`Executing custom uninstallation script: ${step.name}`);
  await uninstall(baselineConfig, context);
  logger.info(`Successfully executed script: ${step.name}`);

  return true;
}

/**
 * Applies the plan of a single custom installation step. An `add` runs its `install` and records
 * the step. A `remove` runs its `uninstall` and records `null`, or keeps the step's record when its
 * `uninstall` could not run.
 */
export async function applyCustomScript(
  plan: CustomScriptDomainPlan,
  context: ApplyContext,
): Promise<ApplyResult<CustomInstallationStepIdentity>> {
  // Custom installation steps have at most 1 operation.
  const operation = plan.operations.at(0);

  if (operation?.kind === "add" && context.targetConfig) {
    return {
      snapshotData: await runAddedStep(
        operation.after,
        context.targetConfig,
        context,
      ),
    };
  }

  if (operation?.kind === "remove") {
    const uninstalled =
      plan.baselineConfig !== null &&
      (await runRemovedStep(operation.before, plan.baselineConfig, context));

    return { snapshotData: uninstalled ? null : operation.before };
  }

  throw new Error(
    `The plan of custom installation step "${plan.path.at(-1)}" has nothing to apply`,
  );
}
