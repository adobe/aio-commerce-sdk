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
  InstallationPhase,
  InstallationPhases,
} from "#management/installation/types";
import type { PhaseState } from "#management/types";

/**
 * A discriminated union representing every possible state of the installation process.
 *
 * The type models a multi-phase, multi-step workflow where:
 * - Each phase contains ordered steps that execute sequentially
 * - Data accumulates as steps complete (step N has access to all data from steps 1..N-1)
 * - Each step can be `pending`, `started`, `completed`, or `failed`
 * - Errors are scoped to their specific step (type-safe error handling)
 *
 * Narrow by `phase`, `step`, and `status` to get precise typing:
 *
 * @example
 * ```ts
 * function handle(state: InstallationState) {
 *   if (state.phase === "events" && state.step === "registrations") {
 *     if (state.status === "completed") {
 *       // data includes: providers + metadata + registrations
 *       console.log(state.data.providers, state.data.registrationIds);
 *     }
 *
 *     if (state.status === "failed") {
 *       // data includes: providers + metadata (not registrations)
 *       // error is narrowed to registration-specific errors
 *       console.log(state.error.key); // "CREATE_FAILED" | "INVALID_PROVIDER"
 *     }
 *   }
 * }
 * ```
 */
export type InstallationState = {
  [P in InstallationPhase]: {
    phase: P;
  } & PhaseState<InstallationPhases[P]>;
}[InstallationPhase];
