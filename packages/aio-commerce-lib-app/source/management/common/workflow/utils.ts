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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  FailedWorkflowState,
  StepStatus,
  SucceededWorkflowState,
  WorkflowError,
} from "./types";

/** Returns the current time as an ISO string. */
export function nowIsoString(): string {
  return new Date().toISOString();
}

/** Sets a value at a nested path in the data object. */
export function setAtPath(
  data: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  const lastKey = path.at(-1);
  if (!lastKey) {
    return;
  }

  let current = data;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    current[key] ??= {};
    current = current[key] as Record<string, unknown>;
  }
  current[lastKey] = value;
}

/** Gets a value at a nested path in the data object. */
export function getAtPath(
  data: Record<string, unknown>,
  path: string[],
): unknown {
  let current: unknown = data;
  for (const key of path) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Creates a workflow error from an exception. */
export async function createWorkflowError(
  err: unknown,
  path: string[],
  key = "STEP_EXECUTION_FAILED",
): Promise<WorkflowError> {
  return {
    key,
    message: await unwrapHttpError(err),
    path,
  };
}

/** Base properties for creating final workflow run states. */
type FinalStateBase = {
  id: string;
  startedAt: string;
  step: StepStatus;
  data: Record<string, unknown> | null;
  config?: CommerceAppConfigOutputModel;
};

/** Creates a succeeded workflow run state. */
export function createSucceededState(
  base: FinalStateBase,
): SucceededWorkflowState {
  return {
    ...base,
    completedAt: nowIsoString(),
    status: "succeeded",
  };
}

/** Creates a failed workflow run state. */
export function createFailedState(
  base: FinalStateBase,
  error: WorkflowError,
): FailedWorkflowState {
  return {
    ...base,
    completedAt: nowIsoString(),
    error,
    status: "failed",
  };
}
