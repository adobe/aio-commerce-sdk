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

/** Status of a phase or step. */
export type ExecutionStatus =
  | "pending"
  | "in_progress"
  | "succeeded"
  | "failed";

/** Overall installation status. */
export type InstallationStatus =
  | "pending"
  | "in_progress"
  | "succeeded"
  | "failed";

/** A structured error with a key for i18n and optional payload. */
export type InstallationError<TPayload = unknown> = {
  phase: string;
  step: string;
  key: string;
  message?: string;
  payload?: TPayload;
};

/** Status of a single step in the installation. */
export type StepStatus = {
  name: string;
  status: ExecutionStatus;
};

/** Status of a phase in the installation. */
export type PhaseStatus = {
  name: string;
  status: ExecutionStatus;
  steps: StepStatus[];
};

/** The full installation state, persisted and returned by get-install-status. */
export type InstallationState = {
  installationId: string;
  startedAt: string;
  completedAt?: string;

  status: InstallationStatus;
  phases: PhaseStatus[];

  data: Record<string, Record<string, unknown>>;
  error: InstallationError | null;
};

/** Interface for persisting installation state. */
export interface InstallationStateStore {
  get(installationId: string): Promise<InstallationState | null>;
  save(state: InstallationState): Promise<void>;
}

/** The serializable installation plan. */
export type InstallationPlan = {
  id: string;
  createdAt: string;
  phases: Array<{
    name: string;
    steps: string[];
  }>;
};
