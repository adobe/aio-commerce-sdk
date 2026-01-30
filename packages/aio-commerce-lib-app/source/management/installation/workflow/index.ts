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

/** biome-ignore-all lint/performance/noBarrelFile: Convenience entrypoint for the workflow module */

export { buildPlan, executeWorkflow } from "./runner";
export {
  defineBranchStep,
  defineLeafStep,
  isBranchStep,
  isLeafStep,
} from "./step";
export { createLibStateStore } from "./storage/lib-state";
export {
  isCompletedState,
  isFailedState,
  isInProgressState,
  isPendingState,
  isSucceededState,
} from "./types";

export type {
  InstallationHooks,
  StepEvent,
  StepFailedEvent,
  StepStartedEvent,
  StepSucceededEvent,
} from "./hooks";
export type { BuildPlanOptions, ExecuteWorkflowOptions } from "./runner";
export type {
  AnyStep,
  BranchStep,
  BranchStepOptions,
  ExecutionContext,
  InferStepOutput,
  InstallationContext,
  LeafStep,
  LeafStepOptions,
  Step,
  StepContextFactory,
  StepMeta,
} from "./step";
export type { LibStateStoreOptions } from "./storage/lib-state";
export type {
  ExecutionStatus,
  FailedInstallationState,
  InProgressInstallationState,
  InstallationData,
  InstallationError,
  InstallationPlan,
  InstallationPlanStep,
  InstallationState,
  InstallationStateStore,
  InstallationStatus,
  PendingInstallationState,
  StepStatus,
  SucceededInstallationState,
} from "./types";
