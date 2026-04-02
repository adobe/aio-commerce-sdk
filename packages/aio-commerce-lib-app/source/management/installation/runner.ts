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
  createRootInstallationStep,
  createRootUninstallationStep,
} from "./root";
import {
  createInitialState,
  executeUninstallWorkflow,
  executeWorkflow,
} from "./workflow";
import { validateStepTree } from "./workflow/validation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  FailedInstallationState,
  InProgressInstallationState,
  InstallationContext,
  InstallationHooks,
  SucceededInstallationState,
  ValidationContext,
} from "./workflow";
import type { ValidationResult } from "./workflow/validation";

/** Options for creating an initial installation state. */
export type CreateInitialInstallationStateOptions = {
  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;
};

/** Options for running an installation. */
export type RunInstallationOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: InstallationContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The initial installation state (with all steps pending). */
  initialState: InProgressInstallationState;

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
): InProgressInstallationState {
  const { config } = options;
  const rootStep = createRootInstallationStep(config);

  return createInitialState({ rootStep, config });
}

/**
 * Runs the full installation workflow. Returns the final state (never throws).
 */
export function runInstallation(
  options: RunInstallationOptions,
): Promise<SucceededInstallationState | FailedInstallationState> {
  const { installationContext, config, initialState, hooks } = options;
  const rootStep = createRootInstallationStep(config);
  return executeWorkflow({
    rootStep,
    installationContext,
    config,
    initialState,
    hooks,
  });
}

/** Options for creating an initial uninstallation state. */
export type CreateInitialUninstallationStateOptions = {
  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;
};

/** Options for running an uninstallation. */
export type RunUninstallationOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: InstallationContext;
  /** The app configuration. */
  config: CommerceAppConfigOutputModel;
  /** The initial uninstallation state (with all steps pending). */
  initialState: InProgressInstallationState;
  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;
};

/**
 * Creates an initial uninstallation state from the config and step definitions.
 */
export function createInitialUninstallationState(
  options: CreateInitialUninstallationStateOptions,
): InProgressInstallationState {
  const { config } = options;
  const rootStep = createRootUninstallationStep(config);
  return createInitialState({ rootStep, config });
}

/**
 * Runs the full uninstallation workflow. Returns the final state (never throws).
 */
export function runUninstallation(
  options: RunUninstallationOptions,
): Promise<SucceededInstallationState | FailedInstallationState> {
  const { installationContext, config, initialState, hooks } = options;
  const rootStep = createRootUninstallationStep(config);
  return executeUninstallWorkflow({
    rootStep,
    installationContext,
    config,
    initialState,
    hooks,
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
  return validateStepTree({ rootStep, validationContext, config });
}
