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
  createRootInstallationStepMock,
  getAssociationDataMock,
  runInstallationMock,
  runUninstallationMock,
  runValidationMock,
} = vi.hoisted(() => {
  const actionInvokeMock = vi.fn();

  return {
    createCombinedStoreMock: vi.fn(),
    createInitialInstallationStateMock: vi.fn(),
    createInitialUninstallationStateMock: vi.fn(),
    createRootInstallationStepMock: vi.fn(),
    getAssociationDataMock: vi.fn(),
    invokeMock: actionInvokeMock,
    openwhiskMock: vi.fn(() => ({
      actions: {
        invoke: actionInvokeMock,
      },
    })),
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

vi.mock("#management/association/repository", () => ({
  getAssociationData: getAssociationDataMock,
}));

vi.mock("#management/installation/root", () => ({
  createRootInstallationStep: createRootInstallationStepMock,
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

import { installationRuntimeAction } from "#actions/installation/index";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import {
  configWithCommerceEventing,
  configWithDynamicListOptions,
  createMockConfig,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockCombinedStoreImpl,
  createMockFailedState,
  createMockInProgressState,
  createMockInstallationContext,
  createMockInstallationStore,
  createMockInstallationSucceededState,
  createMockSucceededState,
  createMockValidationResult,
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";
import {
  createMockLifecycleAttempt,
  createMockLifecycleStore,
  createMockOrchestrationState,
} from "#test/fixtures/lifecycle";
import {
  createMockBranchStep,
  createMockLifecycleLeaf,
} from "#test/fixtures/workflow";

import type {
  AppStateSnapshot,
  OrchestrationState,
} from "#management/common/orchestration";
import type { AnyStep, LeafStep } from "#management/common/workflow/step";
import type { InProgressWorkflowState } from "#management/common/workflow/types";
import type { InstallationHooks } from "#management/installation/runner";

const POST_APP_DEPLOY_HEADERS = {
  "x-aio-commerce-installation-invocation-source": "post-app-deploy",
};

type WorkflowRunnerArgs = {
  initialState: InProgressWorkflowState;
  hooks: InstallationHooks;
};

const { appData } = createMockInstallationContext();
const requestBody = {
  appData,
  commerceBaseUrl: "https://commerce.example.com",
  commerceEnv: "paas",
  ioEventsEnv: "prod",
  ioEventsUrl: "https://events.example.com",
};

describe("installationRuntimeAction", () => {
  let appStateSnapshotStore = createMockLifecycleStore<AppStateSnapshot>();
  let installationStore = createMockInstallationStore();
  let orchestrationStateStore = createMockLifecycleStore<OrchestrationState>();
  let uninstallationStore = createMockInstallationStore();

  beforeEach(() => {
    vi.clearAllMocks();

    appStateSnapshotStore = createMockLifecycleStore<AppStateSnapshot>();
    installationStore = createMockInstallationStore();
    orchestrationStateStore = createMockLifecycleStore<OrchestrationState>();
    uninstallationStore = createMockInstallationStore();

    createCombinedStoreMock.mockImplementation(
      createMockCombinedStoreImpl(() => ({
        appStateSnapshot: appStateSnapshotStore,
        installation: installationStore,
        orchestrationState: orchestrationStateStore,
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
          { isLeaf: true, path: ["validate"], stepName: "validate" },
          inProgressState,
        );
        await hooks.onStepSuccess?.(
          {
            isLeaf: true,
            path: ["validate"],
            result: undefined,
            stepName: "validate",
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
          { isLeaf: true, path: ["cleanup"], stepName: "cleanup" },
          inProgressState,
        );
        await hooks.onStepSuccess?.(
          {
            isLeaf: true,
            path: ["cleanup"],
            result: undefined,
            stepName: "cleanup",
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
        statusCode: 204,
        type: "success",
      });
    });

    test("returns 204 when there is no upgrade state for post-app-deploy", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({ headers: POST_APP_DEPLOY_HEADERS }),
      );

      expect(result).toMatchObject({
        statusCode: 204,
        type: "success",
      });
    });

    test("returns the latest upgrade attempt without its plan for post-app-deploy", async () => {
      const attempt = createMockLifecycleAttempt({
        id: "attempt-1",
        status: "in-progress",
      });
      orchestrationStateStore = createMockLifecycleStore({
        initial: createMockOrchestrationState({ latestAttempt: attempt }),
      });
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({ headers: POST_APP_DEPLOY_HEADERS }),
      );
      const { plan: _plan, ...expectedState } = attempt;

      expect(result).toMatchObject({
        body: expectedState,
        statusCode: 200,
        type: "success",
      });
      expect(result).not.toMatchObject({
        body: { plan: expect.anything() },
      });
    });

    test("returns an upgrade failure for post-app-deploy", async () => {
      const attempt = createMockLifecycleAttempt({
        failure: {
          key: "WEBHOOK_RECONCILIATION_FAILED",
          message: "Webhook reconciliation failed",
          path: ["installation", "webhooks"],
        },
        status: "failed",
      });
      orchestrationStateStore = createMockLifecycleStore({
        initial: createMockOrchestrationState({ latestAttempt: attempt }),
      });
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({ headers: POST_APP_DEPLOY_HEADERS }),
      );

      expect(result).toMatchObject({
        body: {
          failure: {
            key: "WEBHOOK_RECONCILIATION_FAILED",
            message: "Webhook reconciliation failed",
          },
          status: "failed",
        },
        statusCode: 200,
        type: "success",
      });
    });
  });

  const upgradeRequestBody = {
    appData,
    ioEventsEnv: "prod" as const,
    ioEventsUrl: "https://events.adobe.io",
  };

  const configWithAutoUpgrade = createMockConfig({
    metadata: { upgradeMode: "auto" },
  });

  let desiredInstallationStore = createMockInstallationStore();
  let desiredSnapshotStore = createMockLifecycleStore<AppStateSnapshot>();
  let desiredStateStore = createMockLifecycleStore<OrchestrationState>();

  function seedInstalledBaseline(
    version: string,
    id = minimalValidConfig.metadata.id,
  ) {
    desiredInstallationStore = createMockInstallationStore(
      createMockInstallationSucceededState({
        config: createMockConfig({
          metadata: { id, upgradeMode: "auto", version },
        }),
        data: appData,
      }),
    );
  }

  function createUpgradeRoot(leaf?: AnyStep) {
    return createMockBranchStep({
      children: leaf ? [leaf] : [],
      meta: {
        install: { label: "Installation" },
        upgrade: { label: "Upgrade" },
      },
    });
  }

  function createUpgradeLeaf(overrides?: Partial<LeafStep>) {
    return createMockLifecycleLeaf({
      apply: vi.fn().mockResolvedValue({ snapshotData: null }),
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: {},
              id: "operation-1",
              kind: "add",
              label: "Apply synthetic change",
            },
          ],
          path: ["installation", "synthetic"],
        },
      }),
      ...overrides,
    });
  }

  describe("POST /installation desired-state routing", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.stubEnv("__OW_ACTION_VERSION", "7");
      vi.stubEnv("__OW_DEADLINE", "4070908800000");

      desiredInstallationStore = createMockInstallationStore();
      desiredSnapshotStore = createMockLifecycleStore<AppStateSnapshot>();
      desiredStateStore = createMockLifecycleStore<OrchestrationState>();
      createCombinedStoreMock.mockImplementation(
        createMockCombinedStoreImpl(() => ({
          appStateSnapshot: desiredSnapshotStore,
          installation: desiredInstallationStore,
          orchestrationState: desiredStateStore,
          uninstallation: createMockInstallationStore(),
        })),
      );
      seedInstalledBaseline("0.9.0");

      createRootInstallationStepMock.mockReturnValue(createUpgradeRoot());
      getAssociationDataMock.mockResolvedValue({
        commerce: { baseUrl: "https://commerce.example.com", env: "paas" },
      });
      invokeMock.mockResolvedValue({ activationId: "activation-123" });
    });

    async function startAutomaticUpgrade() {
      const action = installationRuntimeAction({
        appConfig: configWithAutoUpgrade,
      });
      const result = await action(
        createRuntimeActionParams({
          body: upgradeRequestBody,
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );
      const attempt = (await desiredStateStore.get("current"))?.latestAttempt;
      expect.assert(attempt, "Expected a persisted upgrade attempt");

      return { action, attemptId: attempt.id, result };
    }

    describe("install branch", () => {
      test("returns 409 when post-app-deploy runs before installation", async () => {
        desiredInstallationStore = createMockInstallationStore();
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            headers: POST_APP_DEPLOY_HEADERS,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).not.toHaveBeenCalled();
        expect(getAssociationDataMock).toHaveBeenCalledOnce();
        expect(result).toMatchObject({
          error: {
            body: {
              message: "The app is not installed.",
              reason: "not-installed",
            },
            statusCode: 409,
          },
          type: "error",
        });
      });

      test("dispatches to installation when no completed install exists", async () => {
        desiredInstallationStore = createMockInstallationStore();
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: requestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "app-management/installation",
            params: expect.objectContaining({
              __ow_method: "post",
              __ow_path: "/execution",
            }),
          }),
        );
        expect(result).toMatchObject({
          body: { operation: "install" },
          statusCode: 202,
          type: "success",
        });
      });
    });

    describe("upgrade branch", () => {
      test("starts an upgrade for post-app-deploy when the app is installed", async () => {
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            headers: POST_APP_DEPLOY_HEADERS,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).toHaveBeenCalledOnce();
        expect(result).toMatchObject({
          body: { operation: "upgrade" },
          statusCode: 202,
          type: "success",
        });
      });

      test("returns 409 when the app is not associated", async () => {
        getAssociationDataMock.mockResolvedValue(null);
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "not-associated" }, statusCode: 409 },
          type: "error",
        });
      });

      test("returns 409 when the application ID changed", async () => {
        const targetConfig = createMockConfig({
          metadata: { id: "renamed-app", upgradeMode: "auto" },
        });
        seedInstalledBaseline(targetConfig.metadata.version, "installed-app");
        const action = installationRuntimeAction({
          appConfig: targetConfig,
        });
        const result = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(createRootInstallationStepMock).not.toHaveBeenCalled();
        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: {
            body: {
              message:
                'The application ID (metadata.id) cannot be changed during an upgrade. Expected "installed-app", received "renamed-app".',
            },
            statusCode: 409,
          },
          type: "error",
        });
        expect(result).not.toMatchObject({
          error: { body: { reason: expect.anything() } },
        });
      });

      test("returns 409 when the installed version is already current", async () => {
        seedInstalledBaseline(configWithAutoUpgrade.metadata.version);
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "already-current" }, statusCode: 409 },
          type: "error",
        });
      });

      test("returns 409 without a reason when upgrade planning is blocked", async () => {
        createRootInstallationStepMock.mockReturnValue(
          createUpgradeRoot(
            createUpgradeLeaf({
              plan: vi.fn().mockResolvedValue({
                issues: [{ message: "incompatible" }],
                kind: "blocked",
              }),
            }),
          ),
        );
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: {
            body: {
              issues: [{ message: "incompatible" }],
              message: "Upgrade planning is blocked",
            },
            statusCode: 409,
          },
          type: "error",
        });
        expect(result).not.toMatchObject({
          error: { body: { reason: expect.anything() } },
        });
      });

      test("reuses the plan without starting execution in manual mode", async () => {
        const action = installationRuntimeAction({
          appConfig: createMockConfig({
            metadata: { upgradeMode: "manual" },
          }),
        });
        await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        const plan = (await desiredStateStore.get("current"))?.pendingPlan;
        expect.assert(plan, "Expected a persisted manual upgrade plan");

        const result = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          body: {
            operation: "upgrade",
            plan: { id: plan.id, operation: "upgrade" },
          },
          statusCode: 200,
          type: "success",
        });
        expect(
          (await desiredStateStore.get("current"))?.latestAttempt,
        ).toBeNull();
      });

      test("starts the planned upgrade in auto mode", async () => {
        const { attemptId, result } = await startAutomaticUpgrade();

        expect(invokeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            blocking: false,
            name: "app-management/installation",
            params: expect.objectContaining({
              __ow_method: "post",
              __ow_path: "/execution",
              attemptId,
            }),
            result: false,
          }),
        );
        expect(result).toMatchObject({
          body: {
            operation: "upgrade",
            plan: {
              actionVersion: "7",
              operation: "upgrade",
              target: {
                appVersion: configWithAutoUpgrade.metadata.version,
                config: configWithAutoUpgrade,
              },
            },
          },
          statusCode: 202,
          type: "success",
        });
      });

      test("allows retry when background dispatch fails", async () => {
        invokeMock.mockRejectedValueOnce(new Error("OpenWhisk unavailable"));
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });

        const failed = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );
        expect(failed).toMatchObject({ type: "error" });

        const retried = await action(
          createRuntimeActionParams({
            body: upgradeRequestBody,
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );
        expect(retried).toMatchObject({
          body: { operation: "upgrade" },
          statusCode: 202,
          type: "success",
        });

        expect(invokeMock).toHaveBeenCalledTimes(2);
        const firstInvocation = invokeMock.mock.calls.at(0)?.at(0);
        const retriedInvocation = invokeMock.mock.calls.at(1)?.at(0);

        expect.assert(
          firstInvocation && retriedInvocation,
          "Expected two background dispatches",
        );

        const firstAttemptId = (
          firstInvocation as { params?: { attemptId?: string } }
        ).params?.attemptId;

        const retriedAttemptId = (
          retriedInvocation as { params?: { attemptId?: string } }
        ).params?.attemptId;

        expect(retriedAttemptId).toBe(firstAttemptId);
      });
    });

    describe("upgrade execution", () => {
      test("rejects an attempt created by an older action version", async () => {
        const { action, attemptId } = await startAutomaticUpgrade();
        vi.stubEnv("__OW_ACTION_VERSION", "8");

        const result = await action(
          createRuntimeActionParams({
            appData,
            attemptId,
            method: "post",
            path: "/execution",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(result).toMatchObject({
          error: { statusCode: 500 },
          type: "error",
        });
        expect(
          (await desiredStateStore.get("current"))?.latestAttempt,
        ).toMatchObject({
          id: attemptId,
          status: "pending",
        });
      });

      test("executes the persisted attempt", async () => {
        const { action, attemptId } = await startAutomaticUpgrade();
        const result = await action(
          createRuntimeActionParams({
            appData,
            attemptId,
            method: "post",
            path: "/execution",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(result).toMatchObject({
          body: { id: attemptId, status: "succeeded" },
          statusCode: 200,
          type: "success",
        });
      });

      test("returns 500 when the attempt fails", async () => {
        createRootInstallationStepMock.mockReturnValue(
          createUpgradeRoot(
            createUpgradeLeaf({
              apply: vi.fn().mockRejectedValue(new Error("boom")),
            }),
          ),
        );
        const { action, attemptId } = await startAutomaticUpgrade();
        const result = await action(
          createRuntimeActionParams({
            appData,
            attemptId,
            method: "post",
            path: "/execution",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(result).toMatchObject({
          error: {
            body: {
              attempt: { id: attemptId, status: "failed" },
            },
            statusCode: 500,
          },
          type: "error",
        });
      });
    });
  });

  describe("GET / with state", () => {
    test("returns installation state when one exists", async () => {
      const existingState = createMockInProgressState({ id: "installation-1" });
      installationStore = createMockInstallationStore(existingState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        body: existingState,
        type: "success",
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
          body: requestBody,
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 409 },
        type: "error",
      });
    });

    test("returns 409 when a completed installation has no saved config", async () => {
      installationStore = createMockInstallationStore(
        createMockInstallationSucceededState(),
      );
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(invokeMock).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        error: {
          body: {
            message:
              "The existing installation does not include its original config and cannot be upgraded safely. Uninstall and reinstall the app.",
          },
          statusCode: 409,
        },
        type: "error",
      });
    });

    test("returns 400 when commerceEnv is not a valid Commerce flavor", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { ...requestBody, commerceEnv: "production" },
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
    });

    test("returns 400 when installing without a commerceBaseUrl", async () => {
      const { commerceBaseUrl: _omitted, ...bodyWithoutCommerce } = requestBody;

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: bodyWithoutCommerce,
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
    });

    test("returns 500 when installation starts without an app config", async () => {
      const handler = installationRuntimeAction({
        // @ts-expect-error - intentionally missing app config
        appConfig: undefined,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
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
          body: requestBody,
          method: "post",
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
          body: requestBody,
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          blocking: false,
          name: "app-management/installation",
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
          body: requestBody,
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: expect.objectContaining({ ...initialState }),
        statusCode: 202,
        type: "success",
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
          appData,
          method: "post",
          path: "/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
    });

    test("runs the installation workflow with the provided initial state", async () => {
      const initialState = createMockInProgressState({ id: "installation-1" });
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/execution",
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
          appData,
          initialState,
          method: "post",
          path: "/execution",
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
              error: failedState.error,
              isLeaf: true,
              path: ["installation", "validate"],
              stepName: "validate",
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
          appData,
          initialState,
          method: "post",
          path: "/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
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
          body: requestBody,
          method: "post",
          path: "/validation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
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
          body: requestBody,
          method: "post",
          path: "/validation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: validationResult,
        type: "success",
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
        body: existingState,
        type: "success",
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
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 409 },
        type: "error",
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
          body: requestBody,
          method: "post",
          path: "/uninstallation",
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
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          blocking: false,
          name: "app-management/installation",
          params: expect.objectContaining({
            __ow_path: "/uninstallation/execution",
          }),
          result: false,
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
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: expect.objectContaining({ ...initialState }),
        statusCode: 202,
        type: "success",
      });
    });

    test("sources uninstallation from the recorded install snapshot, not the drifted request config", async () => {
      // The install snapshot recorded config A (with eventing)...
      installationStore = createMockInstallationStore(
        createMockSucceededState({
          config: configWithCommerceEventing,
          id: "installation-1",
        }),
      );

      // ...while the current request config B has drifted (eventing removed).
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      // Uninstall must be built from the recorded snapshot config.
      expect(createInitialUninstallationStateMock).toHaveBeenCalledWith({
        config: configWithCommerceEventing,
      });

      // ...and the recorded config must flow to the async execution action.
      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            appConfig: configWithCommerceEventing,
          }),
        }),
      );
    });

    test("falls back to the request config when the snapshot has no recorded config (legacy install)", async () => {
      installationStore = createMockInstallationStore(
        createMockSucceededState({ data: null, id: "installation-1" }),
      );

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(createInitialUninstallationStateMock).toHaveBeenCalledWith({
        config: minimalValidConfig,
      });
    });

    test("ignores an in-progress install snapshot and falls back to the request config", async () => {
      // The cache can still hold an actively-running install — only a completed
      // snapshot is authoritative for sourcing the uninstall config.
      installationStore = createMockInstallationStore(
        createMockInProgressState({
          config: configWithCommerceEventing,
          id: "installation-1",
        }),
      );

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(createInitialUninstallationStateMock).toHaveBeenCalledWith({
        config: minimalValidConfig,
      });
    });

    test("CEXT-6661: uninstalls when the recorded snapshot lost its dynamicList functions to storage", async () => {
      // The mock's `put` round-trips through JSON, exactly like the real
      // state/files stores, so the persisted snapshot loses the `options`/
      // `default` functions from `configWithDynamicListOptions` — the same
      // way a real installation record does once it is written to storage.
      installationStore = createMockInstallationStore(null, {
        serialize: true,
      });
      await installationStore.put(
        "installation",
        createMockSucceededState({
          config: configWithDynamicListOptions,
          id: "installation-1",
        }),
      );

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).not.toMatchObject({ statusCode: 500 });
      expect(createInitialUninstallationStateMock).toHaveBeenCalledWith({
        config: expect.objectContaining({
          businessConfig: expect.objectContaining({
            schema: [
              expect.objectContaining({
                name: "paymentMethod",
                type: "dynamicList",
              }),
            ],
          }),
        }),
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
          appData,
          initialState,
          method: "post",
          path: "/uninstallation/execution",
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
      orchestrationStateStore = createMockLifecycleStore<OrchestrationState>({
        initial: createMockOrchestrationState(),
      });

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      const installation = await handler(
        createRuntimeActionParams({ method: "get", path: "/" }),
      );
      expect(installation).toMatchObject({
        statusCode: 204,
        type: "success",
      });
      expect(await orchestrationStateStore.get("current")).toBeNull();
    });

    test("returns 500 and preserves existing state when uninstallation fails", async () => {
      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      const failedState = createMockFailedState({ id: "uninstallation-1" });
      installationStore = createMockInstallationStore(
        createMockSucceededState({ id: "installation-1" }),
      );
      const orchestrationState = createMockOrchestrationState();
      orchestrationStateStore = createMockLifecycleStore<OrchestrationState>({
        initial: orchestrationState,
      });

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
              error: failedState.error,
              isLeaf: true,
              path: ["uninstallation", "cleanup"],
              stepName: "cleanup",
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
          appData,
          initialState,
          method: "post",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
      });
      const installation = await handler(
        createRuntimeActionParams({ method: "get", path: "/" }),
      );
      expect(installation).toMatchObject({
        body: { id: "installation-1", status: "succeeded" },
        statusCode: 200,
        type: "success",
      });
      expect(await orchestrationStateStore.get("current")).toEqual(
        orchestrationState,
      );
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
        statusCode: 204,
        type: "success",
      });
    });
  });
});
