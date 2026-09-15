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
  createInitialState,
  createRetryState,
  executeUninstallWorkflow,
  executeWorkflow,
} from "#management/common/workflow/index";
import { validateStepTree } from "#management/common/workflow/validation";

import {
  createRootInstallationStep,
  createRootUninstallationStep,
} from "./root";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  FailedWorkflowState,
  InProgressWorkflowState,
  LifecycleContext,
  StepFailedEvent,
  StepStartedEvent,
  StepSucceededEvent,
  SucceededWorkflowState,
  ValidationContext,
  WorkflowHooks,
  WorkflowRunState,
} from "#management/common/workflow/index";
import type { ValidationResult } from "#management/common/workflow/validation";
import type { CustomInstallationStepIdentity } from "#management/domains/custom-installation/index";

/** Lifecycle hooks for an installation or uninstallation run. */
export type InstallationHooks = {
  onInstallationStart?: (state: WorkflowRunState) => void | Promise<void>;
  onInstallationSuccess?: (state: WorkflowRunState) => void | Promise<void>;
  onInstallationFailure?: (state: WorkflowRunState) => void | Promise<void>;

  onStepStart?: (
    event: StepStartedEvent,
    state: WorkflowRunState,
  ) => void | Promise<void>;
  onStepSuccess?: (
    event: StepSucceededEvent,
    state: WorkflowRunState,
  ) => void | Promise<void>;
  onStepFailure?: (
    event: StepFailedEvent,
    state: WorkflowRunState,
  ) => void | Promise<void>;
};

/** Adapts historical installation hooks to the neutral workflow hook shape. */
function toWorkflowHooks(hooks?: InstallationHooks): WorkflowHooks | undefined {
  if (!hooks) {
    return;
  }

  return {
    onFailure: hooks.onInstallationFailure,
    onStart: hooks.onInstallationStart,
    onStepFailure: hooks.onStepFailure,
    onStepStart: hooks.onStepStart,
    onStepSuccess: hooks.onStepSuccess,
    onSuccess: hooks.onInstallationSuccess,
  };
}

/** Options for creating an initial installation state. */
export type CreateInitialInstallationStateOptions = {
  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;
};

/** Options for running an installation. */
export type RunInstallationOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: LifecycleContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The initial installation state (with all steps pending). */
  initialState: InProgressWorkflowState;

  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;
};

/**
 * Creates an initial installation state from the config and step definitions.
 * Filters steps based on their `when` conditions and builds a tree structure
 * with all steps set to "pending".
 */
export function createInitialInstallationState(
  options: CreateInitialInstallationStateOptions,
): InProgressWorkflowState {
  const { config } = options;
  const rootStep = createRootInstallationStep(config);

  return createInitialState({ config, rootStep });
}

/**
 * Runs the full installation workflow. Returns the final state (never throws).
 *
 * Retries once on failure. `onInstallationFailure` only fires if both attempts
 * fail; `isRetry: true` is set on the result when the retry succeeds.
 */
export async function runInstallation(
  options: RunInstallationOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState> {
  const { installationContext, config, initialState, hooks } = options;
  const workflowHooks = toWorkflowHooks(hooks);
  const rootStep = createRootInstallationStep(config);
  const firstResult = await executeWorkflow({
    config,
    failureKey: "INSTALLATION_FAILED",
    hooks: {
      ...workflowHooks,
      onFailure: undefined,
      onStepFailure: undefined,
    },
    initialState,
    lifecycleContext: installationContext,
    rootStep,
  });

  if (firstResult.status === "succeeded") {
    return firstResult;
  }

  const { error } = firstResult;
  installationContext.logger.warn(
    `Installation attempt 1 failed: step "${error.path.join(".")}", key "${error.key}"${error.message ? `, message "${error.message}"` : ""}. Retrying once.`,
  );

  const retryState = createRetryState(firstResult);
  const retryResult = await executeWorkflow({
    config,
    failureKey: "INSTALLATION_FAILED",
    hooks: workflowHooks && {
      ...workflowHooks,
      onFailure: (state) =>
        workflowHooks.onFailure?.({
          ...state,
          metadata: { isRetry: true },
        } as WorkflowRunState),
      onSuccess: (state) =>
        workflowHooks.onSuccess?.({
          ...state,
          metadata: { isRetry: true },
        } as WorkflowRunState),
    },
    initialState: retryState,
    lifecycleContext: installationContext,
    rootStep,
  });

  return { ...retryResult, metadata: { isRetry: true } };
}

/** Options for creating an initial uninstallation state. */
export type CreateInitialUninstallationStateOptions = {
  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;

  /**
   * Persisted history of every custom installation step that ever ran, from the lifecycle
   * baseline snapshot. Lets a full unassociate reach steps removed from `config` in a previous
   * upgrade. Defaults to `[]` when there is no recorded history (e.g. legacy installs).
   */
  executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
};

/** Options for running an uninstallation. */
export type RunUninstallationOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: LifecycleContext;
  /** The app configuration. */
  config: CommerceAppConfigOutputModel;
  /** The initial uninstallation state (with all steps pending). */
  initialState: InProgressWorkflowState;
  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;

  /** Same as {@link CreateInitialUninstallationStateOptions.executedCustomInstallationSteps}. */
  executedCustomInstallationSteps?: readonly CustomInstallationStepIdentity[];
};

/**
 * Creates an initial uninstallation state from the config and step definitions.
 */
export function createInitialUninstallationState(
  options: CreateInitialUninstallationStateOptions,
): InProgressWorkflowState {
  const { config, executedCustomInstallationSteps = [] } = options;
  const rootStep = createRootUninstallationStep(
    config,
    executedCustomInstallationSteps,
  );
  return createInitialState({ config, mode: "uninstall", rootStep });
}

/**
 * Runs the full uninstallation workflow. Returns the final state (never throws).
 */
export function runUninstallation(
  options: RunUninstallationOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState> {
  const {
    installationContext,
    config,
    initialState,
    hooks,
    executedCustomInstallationSteps = [],
  } = options;
  const rootStep = createRootUninstallationStep(
    config,
    executedCustomInstallationSteps,
  );
  return executeUninstallWorkflow({
    config,
    failureKey: "INSTALLATION_FAILED",
    hooks: toWorkflowHooks(hooks),
    initialState,
    lifecycleContext: installationContext,
    rootStep,
  });
}

/** Options for running pre-installation validation. */
export type RunValidationOptions = {
  /** Validation context (params, logger, appData — no customScripts). */
  validationContext: ValidationContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;
};

/**
 * Runs pre-installation validation over the full step tree.
 *
 * Traverses the same step hierarchy used during installation but only calls
 * each step's optional `validate` handler rather than executing side effects.
 * Always resolves (never throws). Returns a structured result with per-step
 * issues and an aggregated summary.
 */
export function runValidation(
  options: RunValidationOptions,
): Promise<ValidationResult> {
  const { validationContext, config } = options;
  const rootStep = createRootInstallationStep(config);
  return validateStepTree({ config, rootStep, validationContext });
}
