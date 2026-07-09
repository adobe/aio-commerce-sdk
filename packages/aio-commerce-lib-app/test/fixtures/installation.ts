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
  InstallationState,
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
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL:
    "test-technical-account@example.com",
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
};

export const DEFAULT_INSTALLATION_PARAMS = {
  ...DEFAULT_INSTALLATION_IMS_PARAMS,
  AIO_COMMERCE_API_BASE_URL: "https://api.commerce.adobe.com",
  AIO_COMMERCE_API_FLAVOR: "saas",
  AIO_COMMERCE_AUTH_IMS_API_KEY: "test-api-key",
  AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "prod",
  AIO_COMMERCE_AUTH_IMS_TOKEN: "test-ims-token",
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
      orgName: "test-org-name",
      projectId: "test-project-id",
      projectName: "test-project-name",
      projectTitle: "Test Project Title",
      workspaceId: "test-workspace-id",
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
    children: [],
    id: "root-id",
    meta: { description: "Root step for testing", label: "Root Step" },
    name: "root",
    path: ["root"],
    status: "pending" as ExecutionStatus,
    ...overrides,
  };
}

/** Creates a mock BranchStep for orchestration tests. */
export function createMockBranchStep(
  overrides?: Partial<BranchStep>,
): BranchStep {
  return {
    children: [],
    meta: { install: { label: "Installation" } },
    name: "installation",
    type: "branch",
    ...overrides,
  };
}

/** Creates the default installation root StepStatus used by runner tests. */
export function createMockInstallationStepStatus(
  overrides?: Partial<StepStatus>,
): StepStatus {
  return createMockStepStatus({
    id: "step-id",
    meta: { label: "Installation" },
    name: "installation",
    path: ["installation"],
    status: "pending",
    ...overrides,
  });
}

/** Creates a mock InstallationError for testing. */
export function createMockInstallationError(
  overrides?: Partial<InstallationError>,
): InstallationError {
  return {
    key: "STEP_EXECUTION_FAILED",
    message: "Step execution failed",
    path: ["root", "step"],
    ...overrides,
  };
}

/** Base properties shared by all installation states. */
const baseStateProps = {
  data: {},
  id: "test-installation-1",
  step: createMockStepStatus(),
};

/** Creates a mock InProgressInstallationState. */
export function createMockInProgressState(
  overrides?: Partial<InProgressInstallationState>,
): InProgressInstallationState {
  return {
    ...baseStateProps,
    startedAt: FAKE_SYSTEM_TIME,
    status: "in-progress",
    step: createMockStepStatus({ status: "in-progress" }),
    ...overrides,
  };
}

/** Creates a default installation in-progress state for runner tests. */
export function createMockInstallationInProgressState(
  overrides?: Partial<InProgressInstallationState>,
): InProgressInstallationState {
  return createMockInProgressState({
    data: null,
    id: "installation-id",
    startedAt: FAKE_SYSTEM_TIME,
    step: createMockInstallationStepStatus(),
    ...overrides,
  });
}

/** Creates a mock SucceededInstallationState. */
export function createMockSucceededState(
  overrides?: Partial<SucceededInstallationState>,
): SucceededInstallationState {
  return {
    ...baseStateProps,
    completedAt: FAKE_COMPLETED_TIME,
    startedAt: FAKE_SYSTEM_TIME,
    status: "succeeded",
    step: createMockStepStatus({ status: "succeeded" }),
    ...overrides,
  };
}

/** Creates a default successful installation state for runner tests. */
export function createMockInstallationSucceededState(
  overrides?: Partial<SucceededInstallationState>,
): SucceededInstallationState {
  return createMockSucceededState({
    completedAt: FAKE_COMPLETED_TIME,
    data: null,
    id: "installation-id",
    startedAt: FAKE_SYSTEM_TIME,
    step: createMockInstallationStepStatus({ status: "pending" }),
    ...overrides,
  });
}

/** Creates a mock FailedInstallationState. */
export function createMockFailedState(
  overrides?: Partial<FailedInstallationState>,
): FailedInstallationState {
  return {
    ...baseStateProps,
    completedAt: FAKE_COMPLETED_TIME,
    error: createMockInstallationError(),
    startedAt: FAKE_SYSTEM_TIME,
    status: "failed",
    step: createMockStepStatus({ status: "failed" }),
    ...overrides,
  };
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

/** Creates an in-memory mock of a key/value store for installation state. */
export function createMockInstallationStore(
  initialValue: InstallationState | null = null,
) {
  let value = initialValue;

  return {
    delete: vi.fn(async (_key: string) => {
      const hasValue = value !== null;
      value = null;
      return hasValue;
    }),
    get: vi.fn(async (_key: string) => value),
    put: vi.fn(async (_key: string, nextValue: InstallationState) => {
      value = nextValue;
    }),
  };
}

export type MockInstallationStore = ReturnType<
  typeof createMockInstallationStore
>;

/**
 * Builds a `createCombinedStore` mock implementation that routes to the
 * provided installation/uninstallation stores based on the requested prefix.
 */
export function createMockCombinedStoreImpl(
  getStores: () => {
    installation: MockInstallationStore;
    uninstallation: MockInstallationStore;
  },
) {
  return async (options?: { cache?: { keyPrefix?: string } }) => {
    const prefix = options?.cache?.keyPrefix;
    const stores = getStores();

    if (prefix === "installation") {
      return stores.installation;
    }
    if (prefix === "uninstallation") {
      return stores.uninstallation;
    }

    throw new Error(`Unexpected store prefix: ${String(prefix)}`);
  };
}
