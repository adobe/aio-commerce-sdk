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

import type {
  FailedWorkflowState,
  InProgressWorkflowState,
  StepStatus,
} from "./types";

/**
 * Creates a retry state from a failed state.
 * Preserves succeeded steps and their data so the workflow resumes from
 * the failed step rather than restarting from scratch.
 */
export function createRetryState(
  failedState: FailedWorkflowState,
): InProgressWorkflowState {
  return {
    config: failedState.config,
    data: failedState.data,
    id: failedState.id,
    startedAt: failedState.startedAt,
    status: "in-progress",
    step: resetFailedSteps(failedState.step),
  };
}

/** Recursively resets non-succeeded steps back to "pending". */
function resetFailedSteps(step: StepStatus): StepStatus {
  return {
    ...step,
    children: step.children.map(resetFailedSteps),
    status: step.status === "succeeded" ? "succeeded" : "pending",
  };
}
