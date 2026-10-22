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
import { toItemRef } from "#management/common/workflow/resource";

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
  CustomInstallationDomainPlan,
  CustomInstallationSnapshotData,
  CustomInstallationStepIdentity,
  CustomScriptDomainPlan,
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

/**
 * Builds a `remove` operation for a step no longer in the target config. Its `uninstall` runs only
 * when there is no target config; otherwise it is informational.
 */
function buildRemoveOperation(
  step: CustomInstallationStepIdentity,
  declared: CustomInstallationStep | undefined,
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

/**
 * Resolves the executed-step history to diff the target against. Prefers the reconciliation
 * snapshot when present, and otherwise reconstructs it from the baseline config's own steps.
 */
function resolveBaselineExecutedSteps(
  baseline: PlanningInput<
    CommerceAppConfigOutputModel,
    CustomInstallationSnapshotData
  >["baseline"],
): CustomInstallationStepIdentity[] {
  const recorded = baseline?.data?.executedSteps;
  if (recorded) {
    return recorded;
  }

  // A baseline recorded before the reconciliation leaf shipped has no executed-step history, but
  // its config's steps did run under the old per-script leaves. Seeding them as already-run
  // stops the first upgrade under this version from re-running every one of them as a new `add`.
  if (baseline && hasCustomInstallationSteps(baseline.config)) {
    return baseline.config.installation.customInstallationSteps.map((step) => ({
      name: step.name,
      script: step.script,
    }));
  }

  return [];
}

/**
 * Plans the custom installation steps domain by diffing the baseline's executed-step history
 * against the target config's steps, by `name`: `add` for names not seen before, `remove` for
 * names no longer configured. Steps present in both produce no operation and are never re-run.
 */
export function planCustomInstallationSteps(
  input: PlanningInput<
    CommerceAppConfigOutputModel,
    CustomInstallationSnapshotData
  >,
  _context: ValidationExecutionContext,
): Promise<PlanningResult<CustomInstallationDomainPlan>> {
  const { path, baseline, targetConfig } = input;

  const baselineExecutedSteps = resolveBaselineExecutedSteps(baseline);
  const targetSteps =
    targetConfig && hasCustomInstallationSteps(targetConfig)
      ? targetConfig.installation.customInstallationSteps
      : [];

  const baselineNames = new Set(baselineExecutedSteps.map((s) => s.name));
  const targetNames = new Set(targetSteps.map((s) => s.name));

  const addOperations = targetSteps
    .filter((step) => !baselineNames.has(step.name))
    .map((step) => buildAddOperation(step));

  const baselineSteps =
    baseline && hasCustomInstallationSteps(baseline.config)
      ? baseline.config.installation.customInstallationSteps
      : [];

  const removeOperations = baselineExecutedSteps
    .filter((step) => !targetNames.has(step.name))
    .map((step) =>
      buildRemoveOperation(
        step,
        baselineSteps.find((declared) => declared.name === step.name),
      ),
    );

  const operations: ResourceOperation<CustomInstallationStepIdentity>[] = [
    ...addOperations,
    ...removeOperations,
  ];

  return Promise.resolve({
    kind: "planned",
    plan: {
      baselineConfig: baseline?.config ?? null,
      baselineExecutedSteps,
      operations,
      path,
      targetConfig,
    },
  });
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
function isRemovedNow(
  executed: CustomInstallationStepIdentity,
  baselineConfig: CommerceAppConfigOutputModel | null,
  targetConfig: CommerceAppConfigOutputModel | null,
) {
  return (
    targetConfig === null ||
    (baselineConfig !== null &&
      hasCustomInstallationSteps(baselineConfig) &&
      baselineConfig.installation.customInstallationSteps.some(
        (step) => step.name === executed.name,
      ))
  );
}

/** Plans the operations of a step the deployed config declares. */
function planDeclaredScript(
  declared: CustomInstallationStep,
  executed: CustomInstallationStepIdentity | null | undefined,
  targetConfig: CommerceAppConfigOutputModel | null,
  context: ValidationExecutionContext,
): ResourceOperation<CustomInstallationStepIdentity>[] {
  if (!targetConfig) {
    // Without a stored run history, the deployed config is all that is known about what ran.
    return executed === null
      ? []
      : [buildRemoveOperation(executed ?? declared, declared)];
  }

  if (!executed) {
    return [buildAddOperation(declared)];
  }

  if (executed.script !== declared.script) {
    context.logger.warn(
      `Custom installation step "${declared.name}" now points to a different script ` +
        `("${declared.script}" instead of "${executed.script}"). This does not affect ` +
        "append-only behavior: its install already ran and will not run again.",
    );
  }

  return [];
}

/**
 * Plans a single custom installation step, which never runs twice. With a target config, plans
 * an `add` when the step is declared and has not run. Without one, plans a `remove` when the step
 * is declared and ran, or no run history is stored. A step that ran but is no longer declared has
 * no operation, since its script is no longer deployed, and is reported with a warning when an
 * uninstall or the upgrade that removes it plans it.
 *
 * @param declared - The step as the deployed config declares it, or `null` when it does not.
 * @param executed - The step as it last ran, `null` when it has not run, or `undefined` when no
 *   run history is stored.
 * @param input - The planning input of the step's leaf.
 * @param context - The planning context.
 */
export function planCustomScript(
  declared: CustomInstallationStep | null,
  executed: CustomInstallationStepIdentity | null | undefined,
  input: PlanningInput<
    CommerceAppConfigOutputModel,
    CustomInstallationStepIdentity
  >,
  context: ValidationExecutionContext,
): Promise<PlanningResult<CustomScriptDomainPlan>> {
  const { path, baseline, targetConfig } = input;
  const baselineConfig = baseline?.config ?? null;

  const operations = declared
    ? planDeclaredScript(declared, executed, targetConfig, context)
    : [];

  const issues =
    !declared &&
    executed &&
    isRemovedNow(executed, baselineConfig, targetConfig)
      ? [buildRemovedStepIssue(executed.name)]
      : [];

  return Promise.resolve({
    issues,
    kind: "planned",
    plan: { baselineConfig, operations, path },
  });
}
