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

import { isBranchStep, isLeafStep } from "./step";
import { getAtPath, isStepConfigured, pathsEqual } from "./utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppStateSnapshot } from "#management/common/orchestration";
import type { DomainPlan, PlanningIssue } from "./resource";
import type { AnyStep, BranchStep, LeafStep, LifecycleContext } from "./step";
import type { WorkflowData } from "./types";
import type { ValidationIssue } from "./validation";

/** Options for planning every resource-capable leaf in a workflow. */
export type PlanWorkflowOptions = {
  rootStep: BranchStep;
  lifecycleContext: LifecycleContext;

  /** The state to plan from, or `null` when nothing is installed. */
  baseline: Pick<AppStateSnapshot, "config" | "data"> | null;

  /** The state to plan towards, or `null` when nothing should remain installed. */
  target: {
    config: CommerceAppConfigOutputModel;
  } | null;

  /** The latest attempt, when it failed after the baseline was saved. */
  failedAttempt?: {
    config: CommerceAppConfigOutputModel;
    domains: DomainPlan[];
  };

  /** Whether to also run each planned leaf's `validatePlan` on its plan. */
  validate?: boolean;
};

/** Aggregated output of a workflow planning pass. */
export type PlanWorkflowResult = {
  domains: DomainPlan[];
  issues: PlanningIssue[];
};

/**
 * Runs each resource planner in order and aggregates its plans and issues.
 * @param options - Options for planning every resource-capable leaf in a workflow.
 */
export async function planWorkflow(
  options: PlanWorkflowOptions,
): Promise<PlanWorkflowResult> {
  const domains: DomainPlan[] = [];
  const issues: PlanningIssue[] = [];

  await planStep(
    options.rootStep,
    [],
    {},
    isConfiguredIn(options.rootStep, options.baseline),
    isConfiguredIn(options.rootStep, options.target),
    options.failedAttempt
      ? isStepConfigured(options.rootStep, options.failedAttempt.config)
      : false,
    options,
    domains,
    issues,
  );

  return { domains, issues };
}

/**
 * Plans the resource represented by a step and recursively visits branches.
 * @param step - The step to plan.
 * @param parentPath - Workflow path of the step's parent.
 * @param accumulatedContext - Context contributed by the step's ancestor branches.
 * @param configuredInBaseline - Whether the step and all its ancestors are configured in the baseline config.
 * @param configuredInTarget - Whether the step and all its ancestors are configured in the target config.
 * @param configuredInFailedAttempt - Whether the step and all its ancestors are configured in the failed attempt's target config. Always `false` when there is no failed attempt.
 * @param options - Options for the whole planning pass.
 * @param domains - Collects the plans of planned leaves.
 * @param issues - Collects the issues of blocked leaves.
 */
async function planStep(
  step: AnyStep,
  parentPath: string[],
  accumulatedContext: Record<string, unknown>,
  configuredInBaseline: boolean,
  configuredInTarget: boolean,
  configuredInFailedAttempt: boolean,
  options: PlanWorkflowOptions,
  domains: DomainPlan[],
  issues: PlanningIssue[],
): Promise<void> {
  const path = [...parentPath, step.name];

  if (isBranchStep(step)) {
    const branchContext = step.context
      ? await step.context(options.lifecycleContext)
      : {};

    for (const child of step.children) {
      // A child only counts as configured in the baseline when its parent is configured.
      const childConfiguredInBaseline =
        configuredInBaseline && isConfiguredIn(child, options.baseline);

      // A child only counts as configured in the target when its parent is configured.
      const childConfiguredInTarget =
        configuredInTarget && isConfiguredIn(child, options.target);

      // A child only counts as configured in the failed attempt when its parent is configured.
      // Domains use the failed attempt's config to recognize values it may have left behind.
      const childConfiguredInFailedAttempt =
        configuredInFailedAttempt &&
        options.failedAttempt !== undefined &&
        isStepConfigured(child, options.failedAttempt.config);

      // biome-ignore lint/performance/noAwaitInLoops: planning follows declared domain order
      await planStep(
        child,
        path,
        { ...accumulatedContext, ...branchContext },
        childConfiguredInBaseline,
        childConfiguredInTarget,
        childConfiguredInFailedAttempt,
        options,
        domains,
        issues,
      );
    }

    return;
  }

  if (!(isLeafStep(step) && step.plan)) {
    return;
  }

  const domainTargetConfig =
    configuredInTarget && options.target ? options.target.config : null;
  const domainContext = {
    ...options.lifecycleContext,
    ...accumulatedContext,
  };

  const { failedAttempt } = options;
  const domainPlan = failedAttempt?.domains.find((domain) =>
    pathsEqual(domain.path, path),
  );

  const planningInput = {
    baseline: configuredInBaseline
      ? getDomainBaseline(options.baseline, path)
      : null,
    failedAttempt: failedAttempt && {
      plan: domainPlan ?? null,
      targetConfig: configuredInFailedAttempt ? failedAttempt.config : null,
    },
    path,
    targetConfig: domainTargetConfig,
  };

  const result = await step.plan(planningInput, domainContext);

  // Accumulate in-place (for recursive traversal)
  if (result.kind === "blocked") {
    issues.push(...result.issues.map((issue) => ({ path, ...issue })));
    return;
  }

  domains.push(result.plan);
  issues.push(...asNonBlocking(result.issues ?? [], path));

  if (options.validate) {
    issues.push(
      ...(await validateLeafPlan(
        step,
        result.plan,
        planningInput,
        domainContext,
      )),
    );
  }
}

/** The given issues of a planned leaf, marked as not blocking its plan. */
function asNonBlocking(issues: PlanningIssue[], path: string[]) {
  return issues.map((issue) => ({ path, ...issue, blocking: false }));
}

/** The baseline config and the slice of its data at the given path, or `null` without a baseline. */
function getDomainBaseline(
  baseline: PlanWorkflowOptions["baseline"],
  path: string[],
) {
  return baseline
    ? {
        config: baseline.config,
        data: getAtPath(baseline.data ?? {}, path) as WorkflowData,
      }
    : null;
}

/**
 * Runs a leaf's `validatePlan`, if it has one, and returns what it finds as non-blocking issues
 * of the leaf. A failure to validate is reported as an error issue.
 */
async function validateLeafPlan(
  step: LeafStep,
  ...[plan, input, context]: Parameters<NonNullable<LeafStep["validatePlan"]>>
): Promise<PlanningIssue[]> {
  if (!step.validatePlan) {
    return [];
  }

  const domain = input.path.at(1) ?? step.name;
  const toPlanningIssue = (issue: ValidationIssue): PlanningIssue => ({
    ...issue,
    blocking: false,
    domain,
    path: input.path,
  });

  try {
    const found = await step.validatePlan(plan, input, context);
    return found.map(toPlanningIssue);
  } catch (error) {
    return [
      toPlanningIssue({
        code: "VALIDATION_HANDLER_ERROR",
        message: error instanceof Error ? error.message : String(error),
        severity: "error",
      }),
    ];
  }
}

/** Whether a step is configured in a snapshot's config. Always `false` without a snapshot. */
function isConfiguredIn(
  step: AnyStep,
  state: Pick<AppStateSnapshot, "config"> | null,
) {
  return state !== null && isStepConfigured(step, state.config);
}
