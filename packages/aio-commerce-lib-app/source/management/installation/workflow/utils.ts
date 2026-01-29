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
  FailedInstallationState,
  InstallationError,
  StepStatus,
  SucceededInstallationState,
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
  for (let i = 0; i < path.length - 1; i++) {
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
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Creates an installation error from an exception. */
export function createInstallationError(
  err: unknown,
  path: string[],
  key = "STEP_EXECUTION_FAILED",
): InstallationError {
  return {
    path,
    key,
    message: err instanceof Error ? err.message : String(err),
  };
}

/** Base properties for creating final installation states. */
type FinalStateBase = {
  installationId: string;
  startedAt: string;
  steps: StepStatus[];
  data: Record<string, unknown>;
};

/** Creates a succeeded installation state. */
export function createSucceededState(
  base: FinalStateBase,
): SucceededInstallationState {
  return {
    ...base,
    status: "succeeded",
    completedAt: nowIsoString(),
  };
}

/** Creates a failed installation state. */
export function createFailedState(
  base: FinalStateBase,
  error: InstallationError,
): FailedInstallationState {
  return {
    ...base,
    status: "failed",
    completedAt: nowIsoString(),
    error,
  };
}
