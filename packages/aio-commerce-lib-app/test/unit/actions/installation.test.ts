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

vi.mock("#management/index", async () => {
  const actual =
    await vi.importActual<typeof import("#management/index")>(
      "#management/index",
    );

  return {
    ...actual,
    createInitialInstallationState: createInitialInstallationStateMock,
    createInitialUninstallationState: createInitialUninstallationStateMock,
    runInstallation: runInstallationMock,
    runUninstallation: runUninstallationMock,
    runValidation: runValidationMock,
  };
});

import { installationRuntimeAction } from "#actions/installation";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockCombinedStoreImpl,
  createMockFailedState,
  createMockInProgressState,
  createMockInstallationContext,
  createMockInstallationStore,
  createMockSucceededState,
  createMockValidationResult,
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";
import type { InProgressInstallationState } from "#management/installation/workflow/types";

type WorkflowRunnerArgs = {
  initialState: InProgressInstallationState;
  hooks: InstallationHooks;
};

const appData = createMockInstallationContext().appData;
const requestBody = {
  appData,
  commerceBaseUrl: "https://commerce.example.com",
  commerceEnv: "stage",
  ioEventsUrl: "https://events.example.com",
  ioEventsEnv: "prod",
};

describe("installationRuntimeAction", () => {
  let installationStore = createMockInstallationStore();
  let uninstallationStore = createMockInstallationStore();

  beforeEach(() => {
    vi.clearAllMocks();

    installationStore = createMockInstallationStore();
    uninstallationStore = createMockInstallationStore();

    createCombinedStoreMock.mockImplementation(
      createMockCombinedStoreImpl(() => ({
        installation: installationStore,
        uninstallation: uninstallationStore,
      })),
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

    runInstallationMock.mockImplementation(
      async ({ initialState, hooks }: WorkflowRunnerArgs) => {
        const inProgressState = createMockInProgressState({
          id: initialState.id,
        });
        const succeededState = createMockSucceededState({
          id: initialState.id,
        });

        await hooks.onInstallationStart?.(inProgressState);
        await hooks.onStepStart?.(
          { path: ["validate"], stepName: "validate", isLeaf: true },
          inProgressState,
        );
        await hooks.onStepSuccess?.(
          {
            path: ["validate"],
            stepName: "validate",
            isLeaf: true,
            result: undefined,
          },
          succeededState,
        );
        await hooks.onInstallationSuccess?.(succeededState);

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

        await hooks.onInstallationStart?.(inProgressState);
        await hooks.onStepStart?.(
          { path: ["cleanup"], stepName: "cleanup", isLeaf: true },
          inProgressState,
        );
        await hooks.onStepSuccess?.(
          {
            path: ["cleanup"],
            stepName: "cleanup",
            isLeaf: true,
            result: undefined,
          },
          succeededState,
        );
        await hooks.onInstallationSuccess?.(succeededState);

        return succeededState;
      },
    );

    runValidationMock.mockResolvedValue(createMockValidationResult());
  });

  describe("GET /", () => {
    test("returns 204 when there is no installation state", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "success",
        statusCode: 204,
      });
    });

    test("returns installation state when one exists", async () => {
      const existingState = createMockInProgressState({ id: "installation-1" });
      installationStore = createMockInstallationStore(existingState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "success",
        body: existingState,
      });
    });
  });

  describe("POST /", () => {
    test("returns 409 when installation is already in progress", async () => {
      installationStore = createMockInstallationStore(
        createMockInProgressState(),
      );

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

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 409 },
      });
    });

    test("returns 409 when installation already succeeded", async () => {
      installationStore = createMockInstallationStore(
        createMockSucceededState(),
      );

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

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 409 },
      });
    });

    test("returns 500 when installation starts without an app config", async () => {
      const handler = installationRuntimeAction({
        // @ts-expect-error - intentionally missing app config
        appConfig: undefined,
      });

      const result = await handler(
        createRuntimeActionParams({
          method: "post",
          body: requestBody,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });
    });

    test("stores the initial state when installation starts", async () => {
      const initialState = createMockInProgressState({ id: "installation-1" });
      createInitialInstallationStateMock.mockReturnValue(initialState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "post",
          body: requestBody,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(installationStore.put).toHaveBeenCalledWith(
        "current",
        initialState,
      );
    });

    test("invokes the installation workflow asynchronously via openwhisk", async () => {
      const initialState = createMockInProgressState({ id: "installation-1" });
      createInitialInstallationStateMock.mockReturnValue(initialState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "post",
          body: requestBody,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "app-management/installation",
          blocking: false,
          result: false,
        }),
      );
    });

    test("returns 202 with the initial state when installation starts", async () => {
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

      expect(result).toMatchObject({
        type: "success",
        statusCode: 202,
        body: expect.objectContaining({ ...initialState }),
      });
    });
  });

  describe("POST /execution", () => {
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

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 400 },
      });
    });

    test("runs the installation workflow with the provided initial state", async () => {
      const initialState = createMockInProgressState({ id: "installation-1" });
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "post",
          path: "/execution",
          initialState,
          appData,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(runInstallationMock).toHaveBeenCalledWith(
        expect.objectContaining({ initialState }),
      );
    });

    test("stores the final installation state after execution", async () => {
      const initialState = createMockInProgressState({ id: "installation-1" });
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "post",
          path: "/execution",
          initialState,
          appData,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(installationStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({ id: "installation-1", status: "succeeded" }),
      );
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

          await hooks.onInstallationStart?.(inProgressState);
          await hooks.onStepFailure?.(
            {
              path: ["installation", "validate"],
              stepName: "validate",
              isLeaf: true,
              error: failedState.error,
            },
            failedState,
          );
          await hooks.onInstallationFailure?.(failedState);

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

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });
    });
  });

  describe("POST /validation", () => {
    test("returns 500 when validation runs without an app config", async () => {
      const handler = installationRuntimeAction({
        // @ts-expect-error - intentionally missing app config
        appConfig: undefined,
      });

      const result = await handler(
        createRuntimeActionParams({
          method: "post",
          path: "/validation",
          body: requestBody,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
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

      expect(result).toMatchObject({
        type: "success",
        body: validationResult,
      });
    });
  });

  describe("GET /uninstallation", () => {
    test("returns uninstallation state when one exists", async () => {
      const existingState = createMockInProgressState({
        id: "uninstallation-1",
      });
      uninstallationStore = createMockInstallationStore(existingState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          path: "/uninstallation",
        }),
      );

      expect(result).toMatchObject({
        type: "success",
        body: existingState,
      });
    });
  });

  describe("POST /uninstallation", () => {
    test("returns 409 when uninstallation is already in progress", async () => {
      uninstallationStore = createMockInstallationStore(
        createMockInProgressState(),
      );

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

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 409 },
      });
    });

    test("stores the initial state when uninstallation starts", async () => {
      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      createInitialUninstallationStateMock.mockReturnValue(initialState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
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
    });

    test("invokes the uninstallation workflow asynchronously via openwhisk", async () => {
      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      createInitialUninstallationStateMock.mockReturnValue(initialState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "post",
          path: "/uninstallation",
          body: requestBody,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "app-management/installation",
          blocking: false,
          result: false,
          params: expect.objectContaining({
            __ow_path: "/uninstallation/execution",
          }),
        }),
      );
    });

    test("returns 202 with the initial state when uninstallation starts", async () => {
      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
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

      expect(result).toMatchObject({
        type: "success",
        statusCode: 202,
        body: expect.objectContaining({ ...initialState }),
      });
    });
  });

  describe("POST /uninstallation/execution", () => {
    test("runs the uninstallation workflow with the provided initial state", async () => {
      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "post",
          path: "/uninstallation/execution",
          initialState,
          appData,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(runUninstallationMock).toHaveBeenCalledWith(
        expect.objectContaining({ initialState }),
      );
    });

    test("clears the installation state after a successful uninstallation", async () => {
      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      installationStore = createMockInstallationStore(
        createMockSucceededState({ id: "installation-1" }),
      );

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "post",
          path: "/uninstallation/execution",
          initialState,
          appData,
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(installationStore.delete).toHaveBeenCalledWith("current");
    });

    test("returns 500 when the uninstallation workflow fails", async () => {
      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      const failedState = createMockFailedState({ id: "uninstallation-1" });

      runUninstallationMock.mockImplementation(
        async ({
          initialState: failedInitialState,
          hooks,
        }: WorkflowRunnerArgs) => {
          const inProgressState = createMockInProgressState({
            id: failedInitialState.id,
          });

          await hooks.onInstallationStart?.(inProgressState);
          await hooks.onStepFailure?.(
            {
              path: ["uninstallation", "cleanup"],
              stepName: "cleanup",
              isLeaf: true,
              error: failedState.error,
            },
            failedState,
          );
          await hooks.onInstallationFailure?.(failedState);

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

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 500 },
      });
    });
  });

  describe("DELETE /uninstallation", () => {
    test("clears uninstallation state with DELETE /uninstallation", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          method: "delete",
          path: "/uninstallation",
        }),
      );

      expect(uninstallationStore.delete).toHaveBeenCalledWith("current");
    });

    test("returns 204 when DELETE /uninstallation succeeds", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          method: "delete",
          path: "/uninstallation",
        }),
      );

      expect(result).toMatchObject({
        type: "success",
        statusCode: 204,
      });
    });
  });
});
