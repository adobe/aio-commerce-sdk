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

const { invokeMock, openwhiskMock, createCombinedStoreMock, systemConfig } =
  vi.hoisted(() => {
    const actionInvokeMock = vi.fn();

    return {
      createCombinedStoreMock: vi.fn(),
      invokeMock: actionInvokeMock,
      openwhiskMock: vi.fn(() => ({
        actions: {
          invoke: actionInvokeMock,
        },
      })),
      systemConfig: new Map<string, unknown>(),
    };
  });

vi.mock("@aio-commerce-sdk/common-utils/storage", () => ({
  createCombinedStore: createCombinedStoreMock,
}));

vi.mock("openwhisk", () => ({
  default: openwhiskMock,
}));

// In-memory stand-in for the system config storage behind the association repository.
vi.mock("@adobe/aio-commerce-lib-config", async () => {
  const actual = await vi.importActual<
    typeof import("@adobe/aio-commerce-lib-config")
  >("@adobe/aio-commerce-lib-config");

  return {
    ...actual,
    getSystemConfigByKey: vi.fn(
      async (key: string) => systemConfig.get(key) ?? null,
    ),
    setSystemConfigByKey: vi.fn(async (key: string, value: unknown) => {
      systemConfig.set(key, value);
    }),
  };
});

import { installationRuntimeAction } from "#actions/installation/index";
import {
  clearAssociationData,
  setAssociationData,
} from "#management/association/repository";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import {
  configWithAdminUiSingleGrid,
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
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";
import {
  createMockLifecycleAttempt,
  createMockLifecycleStore,
  createMockOrchestrationState,
} from "#test/fixtures/lifecycle";

import type { RuntimeActionFactoryArgs } from "#actions/installation/common";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  OrchestrationState,
} from "#management/common/orchestration";

const POST_APP_DEPLOY_HEADERS = {
  "x-aio-commerce-installation-invocation-source": "post-app-deploy",
};

const ASSOCIATION = {
  commerce: { baseUrl: "https://commerce.example.com", env: "paas" as const },
};

const SCRIPT_PATH = "./synthetic-step.js";

const failingScript = () => Promise.reject(new Error("boom"));

type ActionArgs = Omit<RuntimeActionFactoryArgs, "appConfig"> & {
  appConfig: CommerceAppConfigOutputModel;
};

/**
 * Adds a custom installation step to the config and loads the given script module for it, so the
 * real lifecycle tree runs the script through the custom-scripts loader.
 */
function withCustomScript(
  config: CommerceAppConfigOutputModel,
  script: unknown,
): ActionArgs {
  return {
    appConfig: {
      ...config,
      installation: {
        customInstallationSteps: [
          {
            description: "Synthetic step",
            name: "Synthetic step",
            script: SCRIPT_PATH,
          },
        ],
      },
    },
    customScriptsLoader: () => ({ [SCRIPT_PATH]: script }),
  };
}

const { appData } = createMockInstallationContext();
const requestBody = {
  appData,
  commerceBaseUrl: "https://commerce.example.com",
  commerceEnv: "paas",
  ioEventsEnv: "prod",
  ioEventsUrl: "https://events.example.com",
};

/** Starts an installation through POST /. */
function requestInstall(handler: ReturnType<typeof installationRuntimeAction>) {
  return handler(
    createRuntimeActionParams({
      body: requestBody,
      method: "post",
      ...DEFAULT_INSTALLATION_PARAMS,
    }),
  );
}

describe("installationRuntimeAction", () => {
  let appStateSnapshotStore = createMockLifecycleStore<AppStateSnapshot>();
  let installationStore = createMockInstallationStore();
  let orchestrationStateStore = createMockLifecycleStore<OrchestrationState>();
  let uninstallationStore = createMockInstallationStore();

  beforeEach(async () => {
    vi.clearAllMocks();
    systemConfig.clear();

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
    await setAssociationData(ASSOCIATION);
    vi.stubEnv("__OW_ACTION_VERSION", "7");
    vi.stubEnv("__OW_DEADLINE", "4070908800000");
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

  describe("POST /installation desired-state routing", () => {
    beforeEach(async () => {
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

      await setAssociationData(ASSOCIATION);
      invokeMock.mockResolvedValue({ activationId: "activation-123" });
    });

    async function startAutomaticUpgrade(
      args: ActionArgs = { appConfig: configWithAutoUpgrade },
    ) {
      const action = installationRuntimeAction(args);
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

      test("returns 409 not-associated when post-app-deploy runs on an unassociated, uninstalled app", async () => {
        desiredInstallationStore = createMockInstallationStore();
        await clearAssociationData();
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
        expect(result).toMatchObject({
          error: {
            body: {
              message: "The app is not associated with a Commerce instance.",
              reason: "not-associated",
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
        const result = await requestInstall(action);

        expect(invokeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "app-management/installation",
            params: expect.objectContaining({
              __ow_method: "post",
              __ow_path: "/execution",
              operation: "install",
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
        await clearAssociationData();
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

        expect(await desiredStateStore.get("current")).toBeNull();
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
        // Registering the Admin UI extension needs the namespace, so planning blocks without it.
        vi.stubEnv("__OW_NAMESPACE", undefined);
        const action = installationRuntimeAction({
          appConfig: createMockConfig({
            adminUi: configWithAdminUiSingleGrid.adminUi,
            metadata: { upgradeMode: "auto" },
          }),
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
              issues: [
                expect.objectContaining({
                  code: "admin-ui-namespace-unavailable",
                }),
              ],
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
            operation: "upgrade",
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
            operation: "upgrade",
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

      test("reports isRetry when the attempt succeeds on its retry", async () => {
        const install = vi
          .fn()
          .mockRejectedValueOnce(new Error("boom"))
          .mockResolvedValue(null);
        const { action, attemptId } = await startAutomaticUpgrade(
          withCustomScript(configWithAutoUpgrade, { install }),
        );
        await action(
          createRuntimeActionParams({
            appData,
            attemptId,
            method: "post",
            operation: "upgrade",
            path: "/execution",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        const result = await action(createRuntimeActionParams());

        expect(result).toMatchObject({
          body: { metadata: { isRetry: true }, status: "succeeded" },
          statusCode: 200,
        });
      });

      test("returns 500 when the attempt fails", async () => {
        const { action, attemptId } = await startAutomaticUpgrade(
          withCustomScript(configWithAutoUpgrade, { install: failingScript }),
        );
        const result = await action(
          createRuntimeActionParams({
            appData,
            attemptId,
            method: "post",
            operation: "upgrade",
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

    test("returns the lifecycle attempt over a stale legacy failed record", async () => {
      installationStore = createMockInstallationStore(
        createMockFailedState({ id: "legacy-installation" }),
      );
      orchestrationStateStore = createMockLifecycleStore({
        initial: createMockOrchestrationState({
          latestAttempt: createMockLifecycleAttempt({
            id: "attempt-1",
            operation: "install",
            status: "succeeded",
          }),
        }),
      });
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        body: { id: "attempt-1", status: "succeeded" },
        statusCode: 200,
      });
    });

    test("reports the recorded completedAt of failed and succeeded attempts", async () => {
      const completedAt = "2026-08-12T09:30:00.000Z";
      for (const status of ["failed", "succeeded"] as const) {
        orchestrationStateStore = createMockLifecycleStore({
          initial: createMockOrchestrationState({
            latestAttempt: Object.assign(
              createMockLifecycleAttempt({ operation: "install", status }),
              { completedAt },
            ),
          }),
        });
        const handler = installationRuntimeAction({
          appConfig: minimalValidConfig,
        });

        // biome-ignore lint/performance/noAwaitInLoops: each status replaces the shared store
        const result = await handler(createRuntimeActionParams());

        expect(result).toMatchObject({ body: { completedAt, status } });
      }
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

    test("persists a pending install attempt when installation starts", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await requestInstall(handler);

      expect(await orchestrationStateStore.get("current")).toMatchObject({
        latestAttempt: { operation: "install", status: "pending" },
      });
    });

    test("invokes the installation workflow asynchronously via openwhisk", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await requestInstall(handler);

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          blocking: false,
          name: "app-management/installation",
          result: false,
        }),
      );
    });

    test("returns 202 with the attempt state when installation starts", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await requestInstall(handler);

      expect(result).toMatchObject({
        body: {
          activationId: "activation-123",
          message: "Installation started",
          operation: "install",
          status: "in-progress",
        },
        statusCode: 202,
        type: "success",
      });
    });
  });

  describe("POST /execution", () => {
    /** Starts an install through POST / and returns its persisted attempt id. */
    async function startInstall(
      args: ActionArgs = { appConfig: minimalValidConfig },
    ) {
      const handler = installationRuntimeAction(args);

      await requestInstall(handler);

      const attempt = (await orchestrationStateStore.get("current"))
        ?.latestAttempt;
      expect.assert(attempt, "Expected a persisted install attempt");

      return { attemptId: attempt.id, handler };
    }

    test("returns 400 when lifecycle execution is missing the app config", async () => {
      const handler = installationRuntimeAction({
        // @ts-expect-error - intentionally missing app config
        appConfig: undefined,
      });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          attemptId: "attempt-1",
          method: "post",
          operation: "install",
          path: "/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: {
          body: { message: "appConfig is required for lifecycle execution" },
          statusCode: 400,
        },
        type: "error",
      });
    });

    test("returns 400 when lifecycle execution is missing the operation", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          appConfig: minimalValidConfig,
          appData,
          attemptId: "attempt-1",
          method: "post",
          path: "/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
      expect(orchestrationStateStore.put).not.toHaveBeenCalled();
    });

    test("executes the persisted install attempt", async () => {
      const { attemptId, handler } = await startInstall();

      const result = await handler(
        createRuntimeActionParams({
          appData,
          attemptId,
          method: "post",
          operation: "install",
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

    test("records the terminal attempt state after execution", async () => {
      const { attemptId, handler } = await startInstall();

      await handler(
        createRuntimeActionParams({
          appData,
          attemptId,
          method: "post",
          operation: "install",
          path: "/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(await orchestrationStateStore.get("current")).toMatchObject({
        latestAttempt: { id: attemptId, status: "succeeded" },
      });
    });

    test("returns 500 when the installation workflow fails", async () => {
      const { attemptId, handler } = await startInstall(
        withCustomScript(minimalValidConfig, { install: failingScript }),
      );

      const result = await handler(
        createRuntimeActionParams({
          appData,
          attemptId,
          method: "post",
          operation: "install",
          path: "/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: {
          body: {
            attempt: { id: attemptId, status: "failed" },
            message: "install failed",
          },
          statusCode: 500,
        },
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
        body: {
          summary: { errors: 0, warnings: 0 },
          valid: true,
        },
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

    test("returns 500 when there is no recorded installation and no app config", async () => {
      const handler = installationRuntimeAction({
        // @ts-expect-error - intentionally missing app config
        appConfig: undefined,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(invokeMock).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        error: {
          body: {
            message:
              "Cannot determine what to uninstall: no recorded lifecycle baseline and no app config was provided.",
          },
          statusCode: 500,
        },
        type: "error",
      });
    });

    test("persists a pending uninstall attempt when uninstallation starts", async () => {
      installationStore = createMockInstallationStore(
        createMockSucceededState({
          config: minimalValidConfig,
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

      expect(await orchestrationStateStore.get("current")).toMatchObject({
        latestAttempt: { operation: "uninstall", status: "pending" },
      });
    });

    test("invokes the uninstallation workflow asynchronously via openwhisk", async () => {
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
            __ow_path: "/execution",
            operation: "uninstall",
          }),
          result: false,
        }),
      );
    });

    test("returns 202 with the attempt state when uninstallation starts", async () => {
      installationStore = createMockInstallationStore(
        createMockSucceededState({
          config: minimalValidConfig,
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

      expect(result).toMatchObject({
        body: {
          activationId: "activation-123",
          message: "Uninstallation started",
          status: "in-progress",
        },
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

      // The recorded config must drive the plan and flow to the async execution action.
      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            __ow_path: "/execution",
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

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ appConfig: minimalValidConfig }),
        }),
      );
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

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ appConfig: minimalValidConfig }),
        }),
      );
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
      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            appConfig: expect.objectContaining({
              businessConfig: expect.objectContaining({
                schema: [
                  expect.objectContaining({
                    name: "paymentMethod",
                    type: "dynamicList",
                  }),
                ],
              }),
            }),
          }),
        }),
      );
    });
  });

  describe("POST /uninstallation/execution", () => {
    /** Starts an uninstall from a recorded install and returns its attempt id. */
    async function startUninstall(
      args: ActionArgs = { appConfig: minimalValidConfig },
    ) {
      installationStore = createMockInstallationStore(
        createMockSucceededState({
          config: args.appConfig,
          id: "installation-1",
        }),
      );

      const handler = installationRuntimeAction(args);

      await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/uninstallation",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      const attempt = (await orchestrationStateStore.get("current"))
        ?.latestAttempt;
      expect.assert(attempt, "Expected a persisted uninstall attempt");

      return { attemptId: attempt.id, handler };
    }

    test("executes the persisted uninstall attempt", async () => {
      const { attemptId, handler } = await startUninstall();

      const result = await handler(
        createRuntimeActionParams({
          appData,
          attemptId,
          method: "post",
          operation: "uninstall",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: { id: attemptId, operation: "uninstall", status: "succeeded" },
        statusCode: 200,
        type: "success",
      });
    });

    test("clears the installation state after a successful uninstallation", async () => {
      const { attemptId, handler } = await startUninstall();

      await handler(
        createRuntimeActionParams({
          appData,
          attemptId,
          method: "post",
          operation: "uninstall",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(installationStore.delete).toHaveBeenCalledWith("current");
      expect(await orchestrationStateStore.get("current")).toMatchObject({
        baselineSnapshotId: null,
      });
    });

    test("returns 500 and preserves existing state when uninstallation fails", async () => {
      const { attemptId, handler } = await startUninstall(
        withCustomScript(minimalValidConfig, {
          install: vi.fn(),
          uninstall: failingScript,
        }),
      );
      const baselineSnapshotId = (await orchestrationStateStore.get("current"))
        ?.baselineSnapshotId;
      expect.assert(baselineSnapshotId, "Expected a recorded baseline");

      const result = await handler(
        createRuntimeActionParams({
          appData,
          attemptId,
          method: "post",
          operation: "uninstall",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: {
          body: { message: "uninstall failed" },
          statusCode: 500,
        },
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
      expect(await orchestrationStateStore.get("current")).toMatchObject({
        baselineSnapshotId,
        latestAttempt: { id: attemptId, status: "failed" },
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
        statusCode: 204,
        type: "success",
      });
    });
  });
});
