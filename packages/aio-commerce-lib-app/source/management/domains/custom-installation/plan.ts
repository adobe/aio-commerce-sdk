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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type {
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type {
  CustomInstallationDomainPlan,
  CustomInstallationOperationValue,
  CustomInstallationSnapshotData,
  CustomInstallationStepIdentity,
} from "./types";

/** Builds an `add` operation for a step run for the first time. */
function buildAddOperation(
  step: CustomInstallationStep,
): ResourceOperation<CustomInstallationOperationValue> {
  return {
    after: { name: step.name, script: step.script },
    id: `add:${step.name}`,
    kind: "add",
    label: `Run custom installation step "${step.name}"`,
  };
}

/**
 * Builds an informational `remove` operation for a step no longer in the target config. No
 * `uninstall` runs from it; it exists so the plan reflects that the step left the configuration.
 */
function buildRemoveOperation(
  step: CustomInstallationStepIdentity,
): ResourceOperation<CustomInstallationOperationValue> {
  return {
    before: { name: step.name, script: step.script },
    id: `remove:${step.name}`,
    kind: "remove",
    label: `Custom installation step "${step.name}" no longer in the configuration`,
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

  const operations: ResourceOperation<CustomInstallationOperationValue>[] = [
    ...targetSteps
      .filter((step) => !baselineNames.has(step.name))
      .map((step) => buildAddOperation(step)),
    ...baselineExecutedSteps
      .filter((step) => !targetNames.has(step.name))
      .map((step) => buildRemoveOperation(step)),
  ];

  return Promise.resolve({
    kind: "planned",
    plan: {
      baselineExecutedSteps,
      operations,
      path,
      targetConfig,
    },
  });
}
