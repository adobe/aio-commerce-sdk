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

import type { StepMeta } from "./step";

/** Status of a step execution. */
export type ExecutionStatus =
  | "pending"
  | "in-progress"
  | "succeeded"
  | "failed"
  | "skipped";

/** Overall installation status. */
export type InstallationStatus =
  | "pending"
  | "in-progress"
  | "succeeded"
  | "failed";

/** A structured error with path to the failing step. */
export type InstallationError<TPayload = unknown> = {
  /** Path to the step that failed (e.g., ["eventing", "commerce", "providers"]). */
  path: string[];

  /** Error key for easy identification. */
  key: string;

  /** Human-readable error message. */
  message?: string;

  /** Additional error payload. */
  payload?: TPayload;
};

/** Status of a step in the installation tree. */
export type StepStatus = {
  /** Step name (unique among siblings). */
  name: string;

  /** Full path from root to this step. */
  path: string[];

  /** Current execution status. */
  status: ExecutionStatus;

  /** Child step statuses (empty for leaf steps). */
  children: StepStatus[];
};

/** Data collected during installation, keyed by step path. */
export type InstallationData = {
  /** Step results keyed by path (e.g., "eventing.commerce.providers"). */
  [pathKey: string]: unknown;
};

/** The full installation state (persisted and returned by status endpoints). */
export type InstallationState = {
  /** Unique installation identifier. */
  installationId: string;

  /** ISO timestamp when installation started. */
  startedAt: string;

  /** ISO timestamp when installation completed (success or failure). */
  completedAt?: string;

  /** Overall installation status. */
  status: InstallationStatus;

  /** Root of the step status tree. */
  steps: StepStatus[];

  /** Results from executed leaf steps, keyed by path. */
  data: InstallationData;

  /** Error information if installation failed. */
  error: InstallationError | null;
};

/** Interface for persisting installation state. */
export interface InstallationStateStore {
  get(installationId: string): Promise<InstallationState | null>;
  save(state: InstallationState): Promise<void>;
}

/** A step in the installation plan (tree structure). */
export type InstallationPlanStep = {
  /** Step name. */
  name: string;

  /** Step metadata for UI display. */
  meta: StepMeta;

  /** Child steps (empty for leaf steps). */
  children: InstallationPlanStep[];
};

/** The serializable installation plan. */
export type InstallationPlan = {
  /** Unique plan identifier. */
  id: string;

  /** ISO timestamp when plan was created. */
  createdAt: string;

  /** Root steps of the installation tree. */
  steps: InstallationPlanStep[];
};
