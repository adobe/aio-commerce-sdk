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

import {
  createMockInProgressState,
  createMockInstallationStepStatus,
  FAKE_SYSTEM_TIME,
} from "./installation";

import type { InProgressWorkflowState } from "#management/common/workflow/types";
import type {
  StepValidationResult,
  ValidationResult,
  ValidationSummary,
} from "#management/deprecated/validation";

/** Creates a default installation in-progress state for runner tests. */
export function createMockInstallationInProgressState(
  overrides?: Partial<InProgressWorkflowState>,
): InProgressWorkflowState {
  return createMockInProgressState({
    data: null,
    id: "installation-id",
    startedAt: FAKE_SYSTEM_TIME,
    step: createMockInstallationStepStatus(),
    ...overrides,
  });
}

/** Creates a mock validation result node for tests. */
export function createMockStepValidationResult(
  overrides?: Partial<StepValidationResult>,
): StepValidationResult {
  return {
    children: [],
    issues: [],
    meta: { label: "Installation" },
    name: "installation",
    path: ["installation"],
    ...overrides,
  };
}

/** Creates a mock validation summary for tests. */
export function createMockValidationSummary(
  overrides?: Partial<ValidationSummary>,
): ValidationSummary {
  return {
    errors: 0,
    totalIssues: 0,
    warnings: 0,
    ...overrides,
  };
}

/** Creates a mock ValidationResult for tests. */
export function createMockValidationResult(
  overrides?: Partial<ValidationResult>,
): ValidationResult {
  return {
    result: createMockStepValidationResult(),
    summary: createMockValidationSummary(),
    valid: true,
    ...overrides,
  };
}
