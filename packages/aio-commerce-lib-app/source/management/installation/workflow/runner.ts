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

import { callHook } from "./hooks";
import { buildStepRegistry, DEFAULT_STEPS } from "./registry";
import { isBranchStep, isLeafStep } from "./step";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationHooks } from "./hooks";
import type {
  AnyStep,
  BranchStep,
  InstallationContext,
  LeafStep,
} from "./step";
import type {
  InstallationPlan,
  InstallationPlanStep,
  InstallationState,
  StepStatus,
} from "./types";

/** Options for creating an installation plan. */
export type CreatePlanOptions = {
  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;

  /** Additional root steps to include beyond the built-in ones. */
  extraSteps?: AnyStep[];
};

/** Options for running an installation. */
export type RunnerOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: InstallationContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The pre-created installation plan to execute. */
  plan: InstallationPlan;

  /** Additional root steps to include beyond the built-in ones. */
  extraSteps?: AnyStep[];

  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;
};

/** Returns the current time as an ISO string. */
function nowIsoString() {
  return new Date().toISOString();
}

/** Converts a path array to a dot-separated key for data storage. */
function pathToKey(path: string[]): string {
  return path.join(".");
}

/**
 * Creates an installation plan from the config and step definitions.
 * Filters steps based on their `when` conditions and builds a tree structure.
 */
export function createInstallationPlan(
  options: CreatePlanOptions,
): InstallationPlan {
  const { config, extraSteps = [] } = options;
  const rootSteps = [...DEFAULT_STEPS, ...extraSteps];

  return {
    id: crypto.randomUUID(),
    createdAt: nowIsoString(),
    steps: buildPlanSteps(rootSteps, config),
  };
}

/** Recursively builds plan steps, filtering by `when` conditions. */
function buildPlanSteps(
  steps: AnyStep[],
  config: CommerceAppConfigOutputModel,
): InstallationPlanStep[] {
  const planSteps: InstallationPlanStep[] = [];

  for (const step of steps) {
    // Check if step applies to this config
    if (step.when && !step.when(config)) {
      continue;
    }

    const planStep: InstallationPlanStep = {
      name: step.name,
      meta: step.meta,
      children: [],
    };

    // Recursively process children for branch steps
    if (isBranchStep(step)) {
      planStep.children = buildPlanSteps(step.children, config);
    }

    planSteps.push(planStep);
  }

  return planSteps;
}

/** Creates the initial installation state from a plan. */
function createInitialState(plan: InstallationPlan): InstallationState {
  return {
    installationId: plan.id,
    startedAt: nowIsoString(),
    status: "in-progress",
    steps: buildInitialStepStatuses(plan.steps, []),
    data: {},
    error: null,
  };
}

/** Recursively builds initial step statuses from plan steps. */
function buildInitialStepStatuses(
  planSteps: InstallationPlanStep[],
  parentPath: string[],
): StepStatus[] {
  return planSteps.map((planStep) => {
    const path = [...parentPath, planStep.name];
    return {
      name: planStep.name,
      path,
      status: "pending",
      children: buildInitialStepStatuses(planStep.children, path),
    };
  });
}

/**
 * Runs the full installation workflow. Returns the final state (never throws).
 * Traverses the step tree depth-first, executing only leaf steps.
 */
export async function runInstallation(
  options: RunnerOptions,
): Promise<InstallationState> {
  const { installationContext, config, plan, extraSteps = [], hooks } = options;

  const stepRegistry = buildStepRegistry(extraSteps);
  const state = createInitialState(plan);

  await callHook(hooks, "onInstallationStart", state);

  try {
    // Execute all root steps sequentially
    for (const stepStatus of state.steps) {
      const step = stepRegistry.get(stepStatus.name);

      if (!step) {
        throw createStepNotFoundError(stepStatus.path, stepStatus.name);
      }

      await executeStep(
        step,
        stepStatus,
        installationContext,
        config,
        {},
        state,
        stepRegistry,
        hooks,
      );
    }

    state.status = "succeeded";
    state.completedAt = nowIsoString();
    await callHook(hooks, "onInstallationSuccess", state);
  } catch (error) {
    state.status = "failed";
    state.completedAt = nowIsoString();

    if (!state.error) {
      state.error = {
        path: [],
        key: "INSTALLATION_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };
    }

    await callHook(hooks, "onInstallationFailure", state);
  }

  return state;
}

/** Creates an error for when a step is not found in the registry. */
function createStepNotFoundError(path: string[], stepName: string): Error {
  const error = new Error(
    `Step "${stepName}" not found in registry. Did you forget to pass it in extraSteps?`,
  );
  (error as Error & { stepPath: string[] }).stepPath = path;
  return error;
}

/** Type for the step registry map. */
type StepRegistry = Map<string, AnyStep>;

/**
 * Executes a step (branch or leaf) with automatic state management.
 * For branch steps: executes children depth-first, then marks as succeeded.
 * For leaf steps: executes the run function.
 */
async function executeStep(
  step: AnyStep,
  stepStatus: StepStatus,
  installationContext: InstallationContext,
  config: CommerceAppConfigOutputModel,
  inheritedContext: Record<string, unknown>,
  state: InstallationState,
  stepRegistry: StepRegistry,
  hooks?: InstallationHooks,
): Promise<void> {
  const path = stepStatus.path;
  const isLeaf = isLeafStep(step);

  // Mark step as in-progress
  stepStatus.status = "in-progress";
  await callHook(
    hooks,
    "onStepStart",
    { path, stepName: step.name, isLeaf },
    state,
  );

  try {
    if (isBranchStep(step)) {
      await executeBranchStep(
        step,
        stepStatus,
        installationContext,
        config,
        inheritedContext,
        state,
        stepRegistry,
        hooks,
      );
    } else if (isLeafStep(step)) {
      await executeLeafStep(
        step,
        stepStatus,
        installationContext,
        config,
        inheritedContext,
        state,
      );
    }

    // Mark step as succeeded
    stepStatus.status = "succeeded";
    await callHook(
      hooks,
      "onStepSuccess",
      {
        path,
        stepName: step.name,
        isLeaf,
        result: state.data[pathToKey(path)],
      },
      state,
    );
  } catch (error) {
    // Mark step as failed
    stepStatus.status = "failed";

    if (!state.error) {
      state.error = {
        path,
        key: "STEP_EXECUTION_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };
    }

    await callHook(
      hooks,
      "onStepFailure",
      { path, stepName: step.name, isLeaf, error: state.error },
      state,
    );

    throw error;
  }
}

/**
 * Executes a branch step by running all children depth-first.
 * Builds inherited context from the branch's context factory.
 */
async function executeBranchStep(
  step: BranchStep,
  stepStatus: StepStatus,
  installationContext: InstallationContext,
  config: CommerceAppConfigOutputModel,
  inheritedContext: Record<string, unknown>,
  state: InstallationState,
  stepRegistry: StepRegistry,
  hooks?: InstallationHooks,
): Promise<void> {
  // Build context for children (merge with inherited)
  let childContext = inheritedContext;
  if (step.context) {
    const stepContext = await step.context(installationContext);
    childContext = {
      ...inheritedContext,
      ...(stepContext as Record<string, unknown>),
    };
  }

  // Execute all children sequentially (depth-first)
  for (const childStatus of stepStatus.children) {
    // Find the child step definition
    const childStep = step.children.find((c) => c.name === childStatus.name);

    if (!childStep) {
      throw createStepNotFoundError(childStatus.path, childStatus.name);
    }

    await executeStep(
      childStep,
      childStatus,
      installationContext,
      config,
      childContext,
      state,
      stepRegistry,
      hooks,
    );
  }
}

/**
 * Executes a leaf step by calling its run function.
 * Stores the result in state.data keyed by path.
 */
async function executeLeafStep(
  step: LeafStep,
  stepStatus: StepStatus,
  installationContext: InstallationContext,
  config: CommerceAppConfigOutputModel,
  inheritedContext: Record<string, unknown>,
  state: InstallationState,
): Promise<void> {
  const executionContext = {
    ...installationContext,
    stepContext: inheritedContext,
  };

  const result = await step.run(config, executionContext);

  // Store result keyed by path
  const key = pathToKey(stepStatus.path);
  state.data[key] = result;
}
