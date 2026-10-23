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

import { toItemRef } from "#management/common/workflow/resource";

import { findDeclaredStep } from "./custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type {
  NonBlockingPlanningIssue,
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type {
  CustomInstallationStepIdentity,
  CustomScriptDomainPlan,
  CustomScriptRun,
} from "./types";

/** Builds an `add` operation for a step run for the first time. */
function buildAddOperation(
  step: CustomInstallationStep,
): ResourceOperation<CustomInstallationStepIdentity> {
  return {
    after: { name: step.name, script: step.script },
    id: `add:${step.name}`,
    itemRefs: [toItemRef(step.name, step)],
    kind: "add",
    label: `Run custom installation step "${step.name}"`,
    reason: "change",
  };
}

/** Builds a `remove` operation, which runs the `uninstall` of a step that ran. */
function buildRemoveOperation(
  step: CustomInstallationStepIdentity,
  declared: CustomInstallationStep,
): ResourceOperation<CustomInstallationStepIdentity> {
  return {
    before: { name: step.name, script: step.script },
    id: `remove:${step.name}`,
    itemRefs: [toItemRef(step.name, declared)],
    kind: "remove",
    label: `Remove custom installation step "${step.name}"`,
    reason: "change",
  };
}

/** Builds the warning for a step the config no longer declares, whose script is no longer deployed. */
function buildRemovedStepIssue(name: string): NonBlockingPlanningIssue {
  return {
    blocking: false,
    code: "CUSTOM_INSTALLATION_STEP_REMOVED",
    domain: "customInstallationSteps",
    message: `Custom installation step "${name}" is no longer in the configuration, so nothing will run for it. If its script had an uninstall, it can't run, because the script is no longer deployed.`,
    severity: "warning",
  };
}

/**
 * Whether a step only the run history knows is being removed: by an uninstall, or by an upgrade
 * whose baseline still declares it.
 */
function isBeingRemoved(
  executed: CustomInstallationStepIdentity,
  baselineConfig: CommerceAppConfigOutputModel | null,
  targetConfig: CommerceAppConfigOutputModel | null,
) {
  return (
    targetConfig === null ||
    (baselineConfig !== null &&
      findDeclaredStep(baselineConfig, executed.name) !== undefined)
  );
}

/**
 * Plans a single custom installation step, which never runs twice:
 * - A step the config no longer declares has no operation, since its script is no longer deployed.
 *   An uninstall, or the upgrade that removes it, reports it with a warning.
 * - Without a target config, a declared step that ran, or may have run because no run history is
 *   stored, gets a `remove`.
 * - With a target config, a declared step that has not run gets an `add`.
 *
 * @param run - What is known about the step.
 * @param input - The planning input of the step's leaf.
 * @param context - The planning context.
 */
export function planCustomScript(
  run: CustomScriptRun,
  input: PlanningInput<
    CommerceAppConfigOutputModel,
    CustomInstallationStepIdentity
  >,
  context: ValidationExecutionContext,
): Promise<PlanningResult<CustomScriptDomainPlan>> {
  const { declared, executed, isHistoryStored } = run;
  const { path, baseline, targetConfig } = input;
  const baselineConfig = baseline?.config ?? null;

  const operations: ResourceOperation<CustomInstallationStepIdentity>[] = [];
  const issues: NonBlockingPlanningIssue[] = [];

  if (!declared) {
    if (executed && isBeingRemoved(executed, baselineConfig, targetConfig)) {
      issues.push(buildRemovedStepIssue(executed.name));
    }
  } else if (!targetConfig) {
    // Without a stored run history, the deployed config is all that is known about what ran.
    if (executed || !isHistoryStored) {
      operations.push(buildRemoveOperation(executed ?? declared, declared));
    }
  } else if (!executed) {
    operations.push(buildAddOperation(declared));
  } else if (executed.script !== declared.script) {
    context.logger.warn(
      `Custom installation step "${declared.name}" now points to a different script ` +
        `("${declared.script}" instead of "${executed.script}"). This does not affect ` +
        "append-only behavior: its install already ran and will not run again.",
    );
  }

  return Promise.resolve({
    issues,
    kind: "planned",
    plan: { baselineConfig, operations, path },
  });
}
