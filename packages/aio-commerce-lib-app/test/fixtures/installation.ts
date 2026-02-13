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
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationContext } from "#management/installation/workflow/step";
import type {
  ExecutionStatus,
  FailedInstallationState,
  InProgressInstallationState,
  InstallationError,
  PendingInstallationState,
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
    appCredentials: {
      consumerOrgId: "test-consumer-org-id",
      projectId: "test-project-id",
      workspaceId: "test-workspace-id",
      ...(overrides?.appCredentials ?? {}),
    },

    params: {
      ...(overrides?.params ?? {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
      }),
    },
    logger: overrides?.logger ?? createMockLogger(),
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

/** Creates a mock PendingInstallationState. */
export function createMockPendingState(
  overrides?: Partial<PendingInstallationState>,
): PendingInstallationState {
  return {
    ...baseStateProps,
    status: "pending",
    ...overrides,
  };
}

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

/** Base metadata for test configs. */
export const mockMetadata = {
  id: "test-app",
  displayName: "Test App",
  description: "A test application",
  version: "1.0.0",
};

/** Commerce eventing configuration part. */
const commerceEventingPart = {
  commerce: [
    {
      provider: {
        label: "Commerce Events Provider",
        description: "Provides commerce events",
      },
      events: [
        {
          name: "plugin.order_placed",
          label: "Order Placed",
          fields: ["order_id", "customer_id"],
          runtimeActions: ["my-package/handle-order"],
          description: "Triggered when an order is placed",
        },
      ],
    },
  ],
};

/** External eventing configuration part. */
const externalEventingPart = {
  external: [
    {
      provider: {
        label: "External Events Provider",
        description: "Provides external events",
      },
      events: [
        {
          name: "external_event",
          label: "External Event",
          description: "An external event",
          runtimeActions: ["my-package/handle-external-event"],
        },
      ],
    },
  ],
};

/** Webhooks configuration part. */
const webhooksPart = [
  {
    name: "order.created",
    url: "https://example.com/webhook",
  },
];

/** Minimal valid config with only required metadata fields. */
export const minimalValidConfig: CommerceAppConfigOutputModel = {
  metadata: mockMetadata,
};

/** Config fixture with eventing.commerce configured. */
export const configWithCommerceEventing: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-commerce-events" },
  eventing: commerceEventingPart,
};

/** Config fixture with eventing.external configured. */
export const configWithExternalEventing: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-external-events" },
  eventing: externalEventingPart,
};

/** Config fixture with webhooks configured. */
export const configWithWebhooks: CommerceAppConfigOutputModel & {
  webhooks: unknown[];
} = {
  metadata: { ...mockMetadata, id: "test-app-webhooks" },
  webhooks: webhooksPart,
};

/** Config fixture with both commerce and external eventing. */
export const configWithFullEventing: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-full-eventing" },
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
};

/** Config fixture with both eventing and webhooks configured. */
export const configWithEventingAndWebhooks: CommerceAppConfigOutputModel & {
  webhooks: unknown[];
} = {
  metadata: { ...mockMetadata, id: "test-app-full" },
  eventing: {
    ...commerceEventingPart,
    ...externalEventingPart,
  },
  webhooks: webhooksPart,
};

/** Config fixture with custom installation steps. */
export const configWithCustomInstallationSteps: CommerceAppConfigOutputModel = {
  metadata: { ...mockMetadata, id: "test-app-with-custom-installation-steps" },
  installation: {
    customInstallationSteps: [
      {
        script: "./demo-success.js",
        name: "Demo Success",
        description: "Success script",
      },
      {
        script: "./demo-error.js",
        name: "Demo Error",
        description: "Error script",
      },
    ],
  },
};
