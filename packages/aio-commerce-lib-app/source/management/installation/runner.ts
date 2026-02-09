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

import { createRootInstallationStep } from "./root";
import { buildPlan, executeWorkflow } from "./workflow";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  FailedInstallationState,
  InstallationContext,
  InstallationHooks,
  InstallationPlan,
  SucceededInstallationState,
} from "./workflow";

/** Options for creating an installation plan. */
export type CreateInstallationPlanOptions = {
  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;
};

/** Options for running an installation. */
export type RunInstallationOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: InstallationContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The pre-created installation plan to execute. */
  plan: InstallationPlan;

  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;
};

/**
 * Creates an installation plan from the config and step definitions.
 * Filters steps based on their `when` conditions and builds a tree structure.
 */
export function createInstallationPlan(
  options: CreateInstallationPlanOptions,
): InstallationPlan {
  const { config } = options;
  const rootStep = createRootInstallationStep();

  return buildPlan({ rootStep, config });
}

/**
 * Runs the full installation workflow. Returns the final state (never throws).
 */
export function runInstallation(
  options: RunInstallationOptions,
): Promise<SucceededInstallationState | FailedInstallationState> {
  const { installationContext, config, plan, hooks } = options;
  const rootStep = createRootInstallationStep();

  return executeWorkflow({
    rootStep,
    installationContext,
    config,
    plan,
    hooks,
  });
}
