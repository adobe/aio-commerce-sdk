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

import { HttpResponse, http } from "msw";
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
  const actionInvokeMock = vi.fn();

  return {
    createCombinedStoreMock: vi.fn(),
    createInitialInstallationStateMock: vi.fn(),
    createInitialUninstallationStateMock: vi.fn(),
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
import { getWebhookIdentity } from "#management/installation/webhooks/helpers";
import { PLAN_KEY } from "#management/upgrade/plan-store";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import {
  configWithCommerceEventing,
  minimalValidConfig,
  mockMetadata,
} from "#test/fixtures/config";
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
import { createMockExistingCommerceWebhook } from "#test/fixtures/webhooks";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationHooks } from "#management/installation/workflow/hooks";
import type { InProgressInstallationState } from "#management/installation/workflow/types";
import type { CleanupList } from "#management/upgrade/types";

type WorkflowRunnerArgs = {
  initialState: InProgressInstallationState;
  hooks: InstallationHooks;
};

const COMMERCE_BASE_URL = "https://api.commerce.adobe.com/V1";

/** In-memory mock of a generic key/value store, mirroring the installation store fixture. */
function createMockGenericStore<T>() {
  let value: T | null = null;

  return {
    delete: vi.fn(async (_key: string) => {
      const hasValue = value !== null;
      value = null;
      return hasValue;
    }),
    get: vi.fn(async (_key: string) => value),
    put: vi.fn(async (_key: string, nextValue: T) => {
      value = nextValue;
    }),
  };
}

setupApiTestLifecycle();

const { appData } = createMockInstallationContext();
const requestBody = {
  appData,
  commerceBaseUrl: "https://commerce.example.com",
  commerceEnv: "paas",
  ioEventsEnv: "prod",
  ioEventsUrl: "https://events.example.com",
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

    test("returns 409 when installation already succeeded", async () => {
      installationStore = createMockInstallationStore(
        createMockSucceededState(),
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
    });
  });

  describe("POST /uninstallation/execution — cleanup-list union teardown (spec §11)", () => {
    const metadata = { ...mockMetadata, id: "test-app-cleanup-teardown" };

    const keptWebhook = {
      category: "modification" as const,
      description: "Webhook kept from the baseline",
      label: "Order Created Webhook",
      requireAdobeAuth: true,
      runtimeAction: "my-package/handle-webhook",
      webhook: {
        batch_name: "default",
        hook_name: "order_created",
        method: "POST",
        webhook_method: "plugin.order.api.order_created",
        webhook_type: "after",
      },
    };

    /** Not part of the baseline config — simulates a failed update's leftover resource. */
    const orphanedWebhook = {
      category: "modification" as const,
      description: "Webhook added by a failed in-flight update",
      label: "Order Cancelled Webhook",
      requireAdobeAuth: true,
      runtimeAction: "my-package/handle-cancel-webhook",
      webhook: {
        batch_name: "default",
        hook_name: "order_cancelled",
        method: "POST",
        webhook_method: "plugin.order.api.order_cancelled",
        webhook_type: "after",
      },
    };

    const baselineConfig = {
      metadata,
      webhooks: [keptWebhook],
    } satisfies CommerceAppConfigOutputModel;

    let cleanupStore: ReturnType<typeof createMockGenericStore<CleanupList>>;

    beforeEach(() => {
      cleanupStore = createMockGenericStore<CleanupList>();

      createCombinedStoreMock.mockImplementation(
        async (options?: { cache?: { keyPrefix?: string } }) => {
          const prefix = options?.cache?.keyPrefix;

          if (prefix === "installation") {
            return installationStore;
          }
          if (prefix === "uninstallation") {
            return uninstallationStore;
          }
          if (prefix === "update-cleanup") {
            return cleanupStore;
          }

          throw new Error(`Unexpected store prefix: ${String(prefix)}`);
        },
      );
    });

    test("tears down a cleanup-list entry not covered by the baseline config, and clears the cleanup store on success", async () => {
      // The cleanup list carries one entry the baseline walk already covers (the
      // kept webhook) and one it doesn't (the orphaned webhook) — only the latter
      // should be torn down.
      const cleanupStoreValue: CleanupList = {
        entries: [
          {
            domain: "commerceWebhook",
            identity: getWebhookIdentity(keptWebhook.webhook),
          },
          {
            domain: "commerceWebhook",
            identity: getWebhookIdentity(orphanedWebhook.webhook),
          },
        ],
      };
      await cleanupStore.put(PLAN_KEY, cleanupStoreValue);

      const unsubscribeCalls: Record<string, unknown>[] = [];
      apiServer.use(
        http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
          HttpResponse.json([
            createMockExistingCommerceWebhook({
              batch_name: "test_app_cleanup_teardown_default",
              hook_name: "test_app_cleanup_teardown_order_cancelled",
              webhook_method: orphanedWebhook.webhook.webhook_method,
              webhook_type: orphanedWebhook.webhook.webhook_type,
            }),
          ]),
        ),
        http.post(
          `${COMMERCE_BASE_URL}/webhooks/unsubscribe`,
          async ({ request }) => {
            unsubscribeCalls.push(
              (await request.json()) as Record<string, unknown>,
            );
            return HttpResponse.json({});
          },
        ),
      );

      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      const handler = installationRuntimeAction({ appConfig: baselineConfig });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({ statusCode: 200, type: "success" });

      expect(unsubscribeCalls).toHaveLength(1);
      expect(unsubscribeCalls[0]).toEqual({
        webhook: expect.objectContaining({
          batch_name: "test_app_cleanup_teardown_default",
          hook_name: "test_app_cleanup_teardown_order_cancelled",
        }),
      });

      await expect(cleanupStore.get(PLAN_KEY)).resolves.toBeNull();
    });

    test("swallows a resource-already-gone (404) delete without failing the uninstall", async () => {
      await cleanupStore.put(PLAN_KEY, {
        entries: [
          {
            domain: "commerceWebhook",
            identity: getWebhookIdentity(orphanedWebhook.webhook),
          },
        ],
      });

      apiServer.use(
        http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
          HttpResponse.json([
            createMockExistingCommerceWebhook({
              batch_name: "test_app_cleanup_teardown_default",
              hook_name: "test_app_cleanup_teardown_order_cancelled",
              webhook_method: orphanedWebhook.webhook.webhook_method,
              webhook_type: orphanedWebhook.webhook.webhook_type,
            }),
          ]),
        ),
        http.post(
          `${COMMERCE_BASE_URL}/webhooks/unsubscribe`,
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      const handler = installationRuntimeAction({ appConfig: baselineConfig });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({ statusCode: 200, type: "success" });
      await expect(cleanupStore.get(PLAN_KEY)).resolves.toBeNull();
    });

    test("clears the cleanup store on a successful uninstall even with no uncovered entries", async () => {
      await cleanupStore.put(PLAN_KEY, {
        entries: [
          {
            domain: "commerceWebhook",
            identity: getWebhookIdentity(keptWebhook.webhook),
          },
        ],
      });

      const initialState = createMockInProgressState({
        id: "uninstallation-1",
      });
      const handler = installationRuntimeAction({ appConfig: baselineConfig });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({ statusCode: 200, type: "success" });
      await expect(cleanupStore.get(PLAN_KEY)).resolves.toBeNull();
    });

    test("leaves the cleanup list in place when the uninstall fails", async () => {
      const cleanupStoreValue: CleanupList = {
        entries: [
          {
            domain: "commerceWebhook",
            identity: getWebhookIdentity(orphanedWebhook.webhook),
          },
        ],
      };
      await cleanupStore.put(PLAN_KEY, cleanupStoreValue);

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
          await hooks.onInstallationFailure?.(failedState);

          return failedState;
        },
      );

      const handler = installationRuntimeAction({ appConfig: baselineConfig });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/uninstallation/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({ error: { statusCode: 500 } });
      await expect(cleanupStore.get(PLAN_KEY)).resolves.toEqual(
        cleanupStoreValue,
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
