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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { StepMetaInfo } from "./step";

/** Status of a step execution. */
export type ExecutionStatus =
  | "pending"
  | "in-progress"
  | "succeeded"
  | "failed";

/** A structured error with path to the failing step. */
export type WorkflowError<TPayload = unknown> = {
  /** Path to the step that failed (e.g., ["eventing", "commerce", "providers"]). */
  path: string[];

  /** Error key for easy identification. */
  key: string;

  /** Human-readable error message. */
  message?: string;

  /** Additional error payload. */
  payload?: TPayload;
};

/** Status of a step in the workflow tree. */
export type StepStatus = {
  /** Step name (unique among siblings). */
  name: string;

  /** Unique step identifier (e.g., UUID). */
  id: string;

  /** Full path from root to this step. */
  path: string[];

  /** Step metadata (for display purposes). */
  meta: StepMetaInfo;

  /** Current execution status. */
  status: ExecutionStatus;

  /** Child step statuses (empty for leaf steps). */
  children: StepStatus[];
};

/** Data collected during a workflow run as a nested structure following step paths. */
export type WorkflowData = {
  [key: string]: unknown | WorkflowData;
};

/** Base properties shared by all workflow run states. */
type WorkflowRunStateBase = {
  /** Unique workflow run identifier. */
  id: string;

  /** Root step status. */
  step: StepStatus;

  /** Results from executed leaf steps, keyed by path. */
  data: WorkflowData | null;

  /**
   * The validated app configuration that drove this workflow. May be
   * undefined on states persisted before this field was introduced.
   */
  config?: CommerceAppConfigOutputModel;
};

/** Workflow run state when in progress. */
export type InProgressWorkflowState = WorkflowRunStateBase & {
  status: "in-progress";

  /** ISO timestamp when the workflow started. */
  startedAt: string;
};

/** Per-run state metadata captured alongside a workflow run's outcome. */
export type WorkflowStateMetadata = {
  /** True when the workflow was attempted more than once. */
  isRetry: boolean;
};

/** Workflow run state when completed successfully. */
export type SucceededWorkflowState = WorkflowRunStateBase & {
  status: "succeeded";

  /** ISO timestamp when the workflow started. */
  startedAt: string;

  /** ISO timestamp when the workflow completed. */
  completedAt: string;

  /** Per-run state metadata, present when a retry was attempted. */
  metadata?: WorkflowStateMetadata;
};

/** Workflow run state when failed. */
export type FailedWorkflowState = WorkflowRunStateBase & {
  status: "failed";

  /** ISO timestamp when the workflow started. */
  startedAt: string;

  /** ISO timestamp when the workflow failed. */
  completedAt: string;

  /** Error information about the failure. */
  error: WorkflowError;

  /** Per-run state metadata, present when a retry was attempted. */
  metadata?: WorkflowStateMetadata;
};

/**
 * The full workflow run state (persisted and returned by status endpoints).
 * Discriminated union by `status` field.
 */
export type WorkflowRunState =
  | InProgressWorkflowState
  | SucceededWorkflowState
  | FailedWorkflowState;

/** Type guard for in-progress workflow run state. */
export function isInProgressState(
  state: WorkflowRunState,
): state is InProgressWorkflowState {
  return state.status === "in-progress";
}

/** Type guard for succeeded workflow run state. */
export function isSucceededState(
  state: WorkflowRunState,
): state is SucceededWorkflowState {
  return state.status === "succeeded";
}

/** Type guard for failed workflow run state. */
export function isFailedState(
  state: WorkflowRunState,
): state is FailedWorkflowState {
  return state.status === "failed";
}

/** Type guard for completed workflow run state (succeeded or failed). */
export function isCompletedState(
  state: WorkflowRunState,
): state is SucceededWorkflowState | FailedWorkflowState {
  return state.status === "succeeded" || state.status === "failed";
}
