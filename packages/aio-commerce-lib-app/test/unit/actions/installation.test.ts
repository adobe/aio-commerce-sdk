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

import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  invokeMock,
  openwhiskMock,
  createCombinedStoreMock,
  createInitialInstallationStateMock,
  createInitialUninstallationStateMock,
  isCompletedStateMock,
  isFailedStateMock,
  isInProgressStateMock,
  isSucceededStateMock,
  runInstallationMock,
  runUninstallationMock,
  runValidationMock,
} = vi.hoisted(() => {
  const invokeMock = vi.fn();

  return {
    invokeMock,
    openwhiskMock: vi.fn(() => ({
      actions: {
        invoke: invokeMock,
      },
    })),
    createCombinedStoreMock: vi.fn(),
    createInitialInstallationStateMock: vi.fn(),
    createInitialUninstallationStateMock: vi.fn(),
    isCompletedStateMock: vi.fn(),
    isFailedStateMock: vi.fn(),
    isInProgressStateMock: vi.fn(),
    isSucceededStateMock: vi.fn(),
    runInstallationMock: vi.fn(),
    runUninstallationMock: vi.fn(),
    runValidationMock: vi.fn(),
  };
});

vi.mock("@aio-commerce-sdk/common-utils/storage", () => ({
  createCombinedStore: createCombinedStoreMock,
}));

vi.mock("openwhisk", () => ({
  default: openwhiskMock,
}));

vi.mock("#management/index", () => ({
  createInitialInstallationState: createInitialInstallationStateMock,
  createInitialUninstallationState: createInitialUninstallationStateMock,
  isCompletedState: isCompletedStateMock,
  isFailedState: isFailedStateMock,
  isInProgressState: isInProgressStateMock,
  isSucceededState: isSucceededStateMock,
  runInstallation: runInstallationMock,
  runUninstallation: runUninstallationMock,
  runValidation: runValidationMock,
}));

import { installationRuntimeAction } from "#actions/installation";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockFailedState,
  createMockInProgressState,
  createMockInstallationContext,
  createMockSucceededState,
  createMockValidationResult,
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { StepFailedEvent } from "#management/installation/workflow/hooks";
import type {
  InProgressInstallationState,
  InstallationState,
} from "#management/installation/workflow/types";

type StoreOptions = {
  cache?: {
    keyPrefix?: string;
  };
};

type WorkflowHooks = {
  onInstallationStart: (state: InstallationState) => Promise<void>;
  onInstallationFailure: (state: InstallationState) => Promise<void>;
  onInstallationSuccess: (state: InstallationState) => Promise<void>;
  onStepStart: (
    event: { stepName: string },
    state: InstallationState,
  ) => Promise<void>;
  onStepSuccess: (
    event: { stepName: string },
    state: InstallationState,
  ) => Promise<void>;
  onStepFailure: (
    event: StepFailedEvent,
    state: InstallationState,
  ) => Promise<void>;
};

type WorkflowRunnerArgs = {
  initialState: InProgressInstallationState;
  hooks: WorkflowHooks;
};

function createMockStore(initialValue: InstallationState | null = null) {
  let value = initialValue;

  return {
    get: vi.fn(async (_key: string) => value),
    put: vi.fn(async (_key: string, nextValue: InstallationState) => {
      value = nextValue;
    }),
    delete: vi.fn(async (_key: string) => {
      const hasValue = value !== null;
      value = null;
      return hasValue;
    }),
  };
}

const appData = createMockInstallationContext().appData;
const requestBody = {
  appData,
  commerceBaseUrl: "https://commerce.example.com",
  commerceEnv: "stage",
  ioEventsUrl: "https://events.example.com",
  ioEventsEnv: "prod",
};

describe("installationRuntimeAction", () => {
  let installationStore = createMockStore();
  let uninstallationStore = createMockStore();

  beforeEach(() => {
    vi.clearAllMocks();

    installationStore = createMockStore();
    uninstallationStore = createMockStore();

    createCombinedStoreMock.mockImplementation(
      async (options?: StoreOptions) => {
        const prefix = options?.cache?.keyPrefix;

        if (prefix === "installation") {
          return installationStore;
        }

        if (prefix === "uninstallation") {
          return uninstallationStore;
        }

        throw new Error(`Unexpected store prefix: ${String(prefix)}`);
      },
    );

    invokeMock.mockResolvedValue({ activationId: "activation-123" });

    createInitialInstallationStateMock.mockImplementation(() =>
      createMockInProgressState({
        id: "installation-1",
      }),
    );

    createInitialUninstallationStateMock.mockImplementation(() =>
      createMockInProgressState({
        id: "uninstallation-1",
      }),
    );

    isCompletedStateMock.mockImplementation(
      (state: InstallationState) =>
        state.status === "failed" || state.status === "succeeded",
    );
    isFailedStateMock.mockImplementation(
      (state: InstallationState) => state.status === "failed",
    );
    isInProgressStateMock.mockImplementation(
      (state: InstallationState) => state.status === "in-progress",
    );
    isSucceededStateMock.mockImplementation(
      (state: InstallationState) => state.status === "succeeded",
    );

    runInstallationMock.mockImplementation(
      async ({ initialState, hooks }: WorkflowRunnerArgs) => {
        const inProgressState = createMockInProgressState({
          id: initialState.id,
        });
        const succeededState = createMockSucceededState({
          id: initialState.id,
        });

        await hooks.onInstallationStart(inProgressState);
        await hooks.onStepStart({ stepName: "validate" }, inProgressState);
        await hooks.onStepSuccess({ stepName: "validate" }, succeededState);
        await hooks.onInstallationSuccess(succeededState);

        return succeededState;
      },
    );

    runUninstallationMock.mockImplementation(
      async ({ initialState, hooks }: WorkflowRunnerArgs) => {
        const inProgressState = createMockInProgressState({
          id: initialState.id,
        });
        const succeededState = createMockSucceededState({
          id: initialState.id,
        });

        await hooks.onInstallationStart(inProgressState);
        await hooks.onStepStart({ stepName: "cleanup" }, inProgressState);
        await hooks.onStepSuccess({ stepName: "cleanup" }, succeededState);
        await hooks.onInstallationSuccess(succeededState);

        return succeededState;
      },
    );

    runValidationMock.mockResolvedValue(createMockValidationResult());
  });

  test("returns 204 when there is no installation state", async () => {
    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(createRuntimeActionParams());

    expect(createCombinedStoreMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cache: expect.objectContaining({ keyPrefix: "installation" }),
        persistent: expect.objectContaining({ dirPrefix: "installation" }),
      }),
    );
    expect(result).toEqual({
      type: "success",
      statusCode: 204,
    });
  });

  test("returns installation state when one exists", async () => {
    const existingState = createMockInProgressState({ id: "installation-1" });
    installationStore = createMockStore(existingState);

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(createRuntimeActionParams());

    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: existingState,
    });
  });

  test("returns 409 when installation is already in progress", async () => {
    installationStore = createMockStore(createMockInProgressState());

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 409,
        body: {
          message:
            "Installation is already in-progress. Wait for it to complete.",
        },
      },
    });
  });

  test("returns 409 when installation already succeeded", async () => {
    installationStore = createMockStore(createMockSucceededState());

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 409,
        body: {
          message: "Installation has already completed successfully.",
        },
      },
    });
  });

  test("returns 500 when installation starts without an app config", async () => {
    const handler = installationRuntimeAction({
      appConfig: undefined as unknown as CommerceAppConfigOutputModel,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 500,
        body: {
          message:
            "Could not find or parse the app.commerce.manifest.json file, is it present and valid?",
        },
      },
    });
  });

  test("starts installation asynchronously and returns the initial state", async () => {
    const initialState = createMockInProgressState({ id: "installation-1" });
    createInitialInstallationStateMock.mockReturnValue(initialState);

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(createInitialInstallationStateMock).toHaveBeenCalledWith({
      config: minimalValidConfig,
    });
    expect(installationStore.put).toHaveBeenCalledWith("current", initialState);
    expect(openwhiskMock).toHaveBeenCalled();
    expect(invokeMock).toHaveBeenCalledWith({
      name: "app-management/installation",
      blocking: false,
      result: false,
      params: expect.objectContaining({
        ...DEFAULT_INSTALLATION_PARAMS,
        appData,
        AIO_EVENTS_API_BASE_URL: requestBody.ioEventsUrl,
        AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: requestBody.ioEventsEnv,
        AIO_COMMERCE_API_BASE_URL: requestBody.commerceBaseUrl,
        AIO_COMMERCE_API_FLAVOR: requestBody.commerceEnv,
        initialState,
        appConfig: minimalValidConfig,
        __ow_path: "/execution",
        __ow_method: "post",
      }),
    });
    expect(result).toEqual({
      type: "success",
      statusCode: 202,
      body: {
        message: "Installation started",
        activationId: "activation-123",
        ...initialState,
      },
    });
  });

  test("returns 400 when installation execution is missing the initial state", async () => {
    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/execution",
        appData,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 400,
        body: {
          message: "initialState is required for execution",
        },
      },
    });
  });

  test("executes installation and stores the final state", async () => {
    const initialState = createMockInProgressState({ id: "installation-1" });
    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/execution",
        initialState,
        appData,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(runInstallationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: minimalValidConfig,
        initialState,
      }),
    );
    expect(installationStore.put).toHaveBeenCalledWith(
      "current",
      expect.objectContaining({ id: "installation-1", status: "succeeded" }),
    );
    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: expect.objectContaining({
        id: "installation-1",
        status: "succeeded",
      }),
    });
  });

  test("returns 500 when the installation workflow fails", async () => {
    const initialState = createMockInProgressState({ id: "installation-1" });
    const failedState = createMockFailedState({ id: "installation-1" });

    runInstallationMock.mockImplementation(
      async ({
        initialState: failedInitialState,
        hooks,
      }: WorkflowRunnerArgs) => {
        const inProgressState = createMockInProgressState({
          id: failedInitialState.id,
        });

        await hooks.onInstallationStart(inProgressState);
        await hooks.onStepFailure(
          {
            path: ["installation", "validate"],
            stepName: "validate",
            isLeaf: true,
            error: failedState.error,
          },
          failedState,
        );
        await hooks.onInstallationFailure(failedState);

        return failedState;
      },
    );

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/execution",
        initialState,
        appData,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 500,
        body: {
          message: "Installation failed",
          error: failedState.error,
          state: failedState,
        },
      },
    });
  });

  test("returns 500 when validation runs without an app config", async () => {
    const handler = installationRuntimeAction({
      appConfig: undefined as unknown as CommerceAppConfigOutputModel,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/validation",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 500,
        body: {
          message:
            "Could not find or parse the app.commerce.manifest.json file, is it present and valid?",
        },
      },
    });
  });

  test("returns the validation result for POST /validation", async () => {
    const validationResult = createMockValidationResult({ valid: false });
    runValidationMock.mockResolvedValue(validationResult);

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/validation",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(runValidationMock).toHaveBeenCalledWith({
      validationContext: {
        appData,
        params: expect.objectContaining({
          ...DEFAULT_INSTALLATION_PARAMS,
          AIO_EVENTS_API_BASE_URL: requestBody.ioEventsUrl,
          AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: requestBody.ioEventsEnv,
          AIO_COMMERCE_API_BASE_URL: requestBody.commerceBaseUrl,
          AIO_COMMERCE_API_FLAVOR: requestBody.commerceEnv,
        }),
        logger: expect.anything(),
      },
      config: minimalValidConfig,
    });
    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: validationResult,
    });
  });

  test("returns uninstallation state when one exists", async () => {
    const existingState = createMockInProgressState({ id: "uninstallation-1" });
    uninstallationStore = createMockStore(existingState);

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        path: "/uninstallation",
      }),
    );

    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: existingState,
    });
  });

  test("returns 409 when uninstallation is already in progress", async () => {
    uninstallationStore = createMockStore(createMockInProgressState());

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/uninstallation",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 409,
        body: {
          message:
            "Uninstallation is already in progress. Wait for it to complete.",
        },
      },
    });
  });

  test("starts uninstallation asynchronously and returns the initial state", async () => {
    const initialState = createMockInProgressState({ id: "uninstallation-1" });
    createInitialUninstallationStateMock.mockReturnValue(initialState);

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/uninstallation",
        body: requestBody,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(uninstallationStore.put).toHaveBeenCalledWith(
      "current",
      initialState,
    );
    expect(invokeMock).toHaveBeenCalledWith({
      name: "app-management/installation",
      blocking: false,
      result: false,
      params: expect.objectContaining({
        initialState,
        appConfig: minimalValidConfig,
        __ow_path: "/uninstallation/execution",
        __ow_method: "post",
      }),
    });
    expect(result).toEqual({
      type: "success",
      statusCode: 202,
      body: {
        message: "Uninstallation started",
        activationId: "activation-123",
        ...initialState,
      },
    });
  });

  test("executes uninstallation and clears the installation state after success", async () => {
    const initialState = createMockInProgressState({ id: "uninstallation-1" });
    installationStore = createMockStore(
      createMockSucceededState({ id: "installation-1" }),
    );

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/uninstallation/execution",
        initialState,
        appData,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(runUninstallationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: minimalValidConfig,
        initialState,
      }),
    );
    expect(installationStore.delete).toHaveBeenCalledWith("current");
    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: expect.objectContaining({
        id: "uninstallation-1",
        status: "succeeded",
      }),
    });
  });

  test("returns 500 when the uninstallation workflow fails", async () => {
    const initialState = createMockInProgressState({ id: "uninstallation-1" });
    const failedState = createMockFailedState({ id: "uninstallation-1" });

    runUninstallationMock.mockImplementation(
      async ({
        initialState: failedInitialState,
        hooks,
      }: WorkflowRunnerArgs) => {
        const inProgressState = createMockInProgressState({
          id: failedInitialState.id,
        });

        await hooks.onInstallationStart(inProgressState);
        await hooks.onStepFailure(
          {
            path: ["uninstallation", "cleanup"],
            stepName: "cleanup",
            isLeaf: true,
            error: failedState.error,
          },
          failedState,
        );
        await hooks.onInstallationFailure(failedState);

        return failedState;
      },
    );

    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "post",
        path: "/uninstallation/execution",
        initialState,
        appData,
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(result).toEqual({
      type: "error",
      error: {
        statusCode: 500,
        body: {
          message: "Uninstallation failed",
          error: failedState.error,
          state: failedState,
        },
      },
    });
  });

  test("clears uninstallation state with DELETE /uninstallation", async () => {
    const handler = installationRuntimeAction({
      appConfig: minimalValidConfig,
    });

    const result = await handler(
      createRuntimeActionParams({
        method: "delete",
        path: "/uninstallation",
      }),
    );

    expect(uninstallationStore.delete).toHaveBeenCalledWith("current");
    expect(result).toEqual({
      type: "success",
      statusCode: 204,
    });
  });
});
