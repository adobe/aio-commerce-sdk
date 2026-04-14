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

import AioLogger from "@adobe/aio-lib-core-logging";
import { vi } from "vitest";

import type {
  BranchStep,
  InstallationContext,
} from "#management/installation/workflow/step";
import type {
  ExecutionStatus,
  FailedInstallationState,
  InProgressInstallationState,
  InstallationError,
  StepStatus,
  SucceededInstallationState,
} from "#management/installation/workflow/types";
import type {
  StepValidationResult,
  ValidationResult,
  ValidationSummary,
} from "#management/installation/workflow/validation";

export const FAKE_SYSTEM_TIME = "2026-01-30T10:00:00.000Z";
export const FAKE_COMPLETED_TIME = "2026-01-30T10:05:00.000Z";

/** Matches any RFC-4122 UUID string. */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Creates a mock AioLogger with all methods as vi.fn(). */
export function createMockLogger(): ReturnType<typeof AioLogger> {
  const logger = AioLogger("test");
  logger.debug = vi.fn();
  logger.info = vi.fn();
  logger.warn = vi.fn();
  logger.error = vi.fn();
  logger.log = vi.fn();
  logger.verbose = vi.fn();
  logger.silly = vi.fn();
  logger.close = vi.fn();
  return logger;
}

/**
 * Builds an InstallationContext with a pre-populated customScripts map.
 * Use this when testing steps that load and execute custom installation scripts.
 */
export function createMockInstallationContextWithScripts(
  customScripts: Record<string, unknown> = {},
): InstallationContext {
  // createMockInstallationContext does not forward customScripts, so spread it in.
  return { ...createMockInstallationContext(), customScripts };
}

type InstallationContextOverrides = Omit<
  Partial<InstallationContext>,
  "appData" | "params"
> & {
  appData?: Partial<InstallationContext["appData"]>;
  params?: Partial<InstallationContext["params"]>;
};

type InstallationParams = InstallationContext["params"];

type InstallationImsParams = Pick<
  InstallationParams,
  | "AIO_COMMERCE_AUTH_IMS_CLIENT_ID"
  | "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS"
  | "AIO_COMMERCE_AUTH_IMS_ORG_ID"
  | "AIO_COMMERCE_AUTH_IMS_SCOPES"
  | "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID"
  | "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL"
>;

export const DEFAULT_INSTALLATION_IMS_PARAMS: InstallationImsParams = {
  AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
  AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["test-secret-1"],
  AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-ims-org-id",
  AIO_COMMERCE_AUTH_IMS_SCOPES: ["test-scope1", "test-scope2"],
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL:
    "test-technical-account@example.com",
};

export const DEFAULT_INSTALLATION_PARAMS = {
  ...DEFAULT_INSTALLATION_IMS_PARAMS,
  AIO_COMMERCE_API_BASE_URL: "https://api.commerce.adobe.com",
  AIO_COMMERCE_API_FLAVOR: "saas",
  AIO_COMMERCE_AUTH_IMS_TOKEN: "test-ims-token",
  AIO_COMMERCE_AUTH_IMS_API_KEY: "test-api-key",
  AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "prod",
} satisfies InstallationParams;

export function createMockInstallationParams(
  overrides: Partial<InstallationParams> = {},
): InstallationParams {
  return {
    ...DEFAULT_INSTALLATION_PARAMS,
    ...overrides,
  };
}

/** Creates a mock InstallationContext with params and logger. */
export function createMockInstallationContext(
  overrides?: InstallationContextOverrides,
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
    params: createMockInstallationParams(overrides?.params),
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

/** Creates a mock BranchStep for orchestration tests. */
export function createMockBranchStep(
  overrides?: Partial<BranchStep>,
): BranchStep {
  return {
    type: "branch",
    name: "installation",
    meta: { install: { label: "Installation" } },
    children: [],
    ...overrides,
  };
}

/** Creates the default installation root StepStatus used by runner tests. */
export function createMockInstallationStepStatus(
  overrides?: Partial<StepStatus>,
): StepStatus {
  return createMockStepStatus({
    id: "step-id",
    name: "installation",
    path: ["installation"],
    meta: { label: "Installation" },
    status: "pending",
    ...overrides,
  });
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

/** Creates a default installation in-progress state for runner tests. */
export function createMockInstallationInProgressState(
  overrides?: Partial<InProgressInstallationState>,
): InProgressInstallationState {
  return createMockInProgressState({
    id: "installation-id",
    startedAt: FAKE_SYSTEM_TIME,
    step: createMockInstallationStepStatus(),
    data: null,
    ...overrides,
  });
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

/** Creates a default successful installation state for runner tests. */
export function createMockInstallationSucceededState(
  overrides?: Partial<SucceededInstallationState>,
): SucceededInstallationState {
  return createMockSucceededState({
    id: "installation-id",
    startedAt: FAKE_SYSTEM_TIME,
    completedAt: FAKE_COMPLETED_TIME,
    step: createMockInstallationStepStatus({ status: "pending" }),
    data: null,
    ...overrides,
  });
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

/** Creates a mock validation result node for tests. */
export function createMockStepValidationResult(
  overrides?: Partial<StepValidationResult>,
): StepValidationResult {
  return {
    name: "installation",
    path: ["installation"],
    meta: { label: "Installation" },
    issues: [],
    children: [],
    ...overrides,
  };
}

/** Creates a mock validation summary for tests. */
export function createMockValidationSummary(
  overrides?: Partial<ValidationSummary>,
): ValidationSummary {
  return {
    errors: 0,
    warnings: 0,
    totalIssues: 0,
    ...overrides,
  };
}

/** Creates a mock ValidationResult for tests. */
export function createMockValidationResult(
  overrides?: Partial<ValidationResult>,
): ValidationResult {
  return {
    valid: true,
    result: createMockStepValidationResult(),
    summary: createMockValidationSummary(),
    ...overrides,
  };
}
