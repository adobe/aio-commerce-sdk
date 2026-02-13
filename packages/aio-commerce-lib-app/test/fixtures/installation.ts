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

import { vi } from "vitest";

import type AioLogger from "@adobe/aio-lib-core-logging";
import type { InstallationContext } from "#management/installation/workflow/step";
import type {
  ExecutionStatus,
  FailedInstallationState,
  InProgressInstallationState,
  InstallationError,
  StepStatus,
  SucceededInstallationState,
} from "#management/installation/workflow/types";

export const FAKE_SYSTEM_TIME = "2026-01-30T10:00:00.000Z";
export const FAKE_COMPLETED_TIME = "2026-01-30T10:05:00.000Z";

/** Creates a mock AioLogger with all methods as vi.fn(). */
export function createMockLogger(): ReturnType<typeof AioLogger> {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as ReturnType<typeof AioLogger>;
}

/** Creates a mock InstallationContext with params and logger. */
export function createMockInstallationContext(
  overrides?: Partial<InstallationContext>,
): InstallationContext {
  return {
    appData: {
      consumerOrgId: "test-consumer-org-id",
      projectId: "test-project-id",
      workspaceId: "test-workspace-id",
      orgName: "test-org-name",
      projectName: "test-project-name",
      projectTitle: "Test Project Title",
      workspaceName: "test-workspace-name",
      workspaceTitle: "Test Workspace Title",
      ...(overrides?.appData ?? {}),
    },

    logger: overrides?.logger ?? createMockLogger(),
    params: {
      ...(overrides?.params ?? {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["test-secret-1"],
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-ims-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["test-scope1", "test-scope2"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL:
          "test-technical-account-email",
      }),
    },
  };
}

/** Creates a mock StepStatus for testing. */
export function createMockStepStatus(
  overrides?: Partial<StepStatus>,
): StepStatus {
  return {
    id: "root-id",
    name: "root",
    path: ["root"],
    status: "pending" as ExecutionStatus,
    meta: { label: "Root Step", description: "Root step for testing" },
    children: [],
    ...overrides,
  };
}

/** Creates a mock InstallationError for testing. */
export function createMockInstallationError(
  overrides?: Partial<InstallationError>,
): InstallationError {
  return {
    path: ["root", "step"],
    key: "STEP_EXECUTION_FAILED",
    message: "Step execution failed",
    ...overrides,
  };
}

/** Base properties shared by all installation states. */
const baseStateProps = {
  id: "test-installation-1",
  step: createMockStepStatus(),
  data: {},
};

/** Creates a mock InProgressInstallationState. */
export function createMockInProgressState(
  overrides?: Partial<InProgressInstallationState>,
): InProgressInstallationState {
  return {
    ...baseStateProps,
    status: "in-progress",
    startedAt: FAKE_SYSTEM_TIME,
    step: createMockStepStatus({ status: "in-progress" }),
    ...overrides,
  };
}

/** Creates a mock SucceededInstallationState. */
export function createMockSucceededState(
  overrides?: Partial<SucceededInstallationState>,
): SucceededInstallationState {
  return {
    ...baseStateProps,
    status: "succeeded",
    startedAt: FAKE_SYSTEM_TIME,
    completedAt: FAKE_COMPLETED_TIME,
    step: createMockStepStatus({ status: "succeeded" }),
    ...overrides,
  };
}

/** Creates a mock FailedInstallationState. */
export function createMockFailedState(
  overrides?: Partial<FailedInstallationState>,
): FailedInstallationState {
  return {
    ...baseStateProps,
    status: "failed",
    startedAt: FAKE_SYSTEM_TIME,
    completedAt: FAKE_COMPLETED_TIME,
    step: createMockStepStatus({ status: "failed" }),
    error: createMockInstallationError(),
    ...overrides,
  };
}
