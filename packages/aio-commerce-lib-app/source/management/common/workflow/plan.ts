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
import { getAtPath, isStepConfigured } from "./utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppStateSnapshot } from "#management/common/orchestration";
import type { DomainPlan, PlanningIssue } from "./resource";
import type { AnyStep, BranchStep, LifecycleContext } from "./step";
import type { WorkflowData } from "./types";

/** Options for planning every resource-capable leaf in a workflow. */
export type PlanWorkflowOptions = {
  rootStep: BranchStep;
  lifecycleContext: LifecycleContext;
  baseline: AppStateSnapshot;
  target: {
    config: CommerceAppConfigOutputModel;
  };
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
    isStepConfigured(options.rootStep, options.baseline.config),
    isStepConfigured(options.rootStep, options.target.config),
    options,
    domains,
    issues,
  );

  return { domains, issues };
}

/** Plans the resource represented by a step and recursively visits branches. */
async function planStep(
  step: AnyStep,
  parentPath: string[],
  accumulatedContext: Record<string, unknown>,
  configuredInBaseline: boolean,
  configuredInTarget: boolean,
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
      const childConfiguredInBaseline =
        configuredInBaseline &&
        isStepConfigured(child, options.baseline.config);

      const childConfiguredInTarget =
        configuredInTarget && isStepConfigured(child, options.target.config);

      // biome-ignore lint/performance/noAwaitInLoops: planning follows declared domain order
      await planStep(
        child,
        path,
        { ...accumulatedContext, ...branchContext },
        childConfiguredInBaseline,
        childConfiguredInTarget,
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

  const domainBaseline = configuredInBaseline
    ? {
        config: options.baseline.config,
        data: getAtPath(options.baseline.data ?? {}, path) as WorkflowData,
      }
    : null;

  const domainTargetConfig = configuredInTarget ? options.target.config : null;

  const domainContext = {
    ...options.lifecycleContext,
    ...accumulatedContext,
  };

  const planningInput = {
    baseline: domainBaseline,
    path,
    targetConfig: domainTargetConfig,
  };

  const result = await step.plan(planningInput, domainContext);

  // Accumulate in-place (for recursive traversal)
  if (result.kind === "blocked") {
    issues.push(...result.issues);
  } else {
    domains.push(result.plan);
  }
}
