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

export {
  createInitialPlanExecutionState,
  executePlannedWorkflow,
} from "./execute";
export { planWorkflow } from "./plan";
export {
  createInitialState,
  createRetryState,
  executeUninstallWorkflow,
  executeWorkflow,
} from "./runner";
export {
  defineBranchStep,
  defineLeafStep,
  isBranchStep,
  isLeafStep,
} from "./step";
export {
  isCompletedState,
  isFailedState,
  isInProgressState,
  isSucceededState,
} from "./types";
export { validateStepTree } from "./validation";

export type {
  StepEvent,
  StepFailedEvent,
  StepStartedEvent,
  StepSucceededEvent,
  WorkflowHooks,
} from "./hooks";
export type {
  AnyStep,
  BranchStep,
  BranchStepOptions,
  ExecutionContext,
  InferStepOutput,
  LeafStep,
  LeafStepOptions,
  LifecycleContext,
  Step,
  StepContextFactory,
  StepMeta,
  StepMetaInfo,
  ValidationContext,
  ValidationExecutionContext,
  ValidationIssue,
  ValidationIssueSeverity,
} from "./step";
export type {
  ExecutionStatus,
  FailedWorkflowState,
  InProgressWorkflowState,
  StepStatus,
  SucceededWorkflowState,
  WorkflowData,
  WorkflowError,
  WorkflowRunState,
  WorkflowStateMetadata,
} from "./types";
export type {
  StepValidationResult,
  ValidateStepTreeOptions,
  ValidationResult,
  ValidationSummary,
} from "./validation";
