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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const {
  invokeMock,
  openwhiskMock,
  createCombinedStoreMock,
  runUpdateMock,
  runValidationMock,
} = vi.hoisted(() => {
  const actionInvokeMock = vi.fn();

  return {
    createCombinedStoreMock: vi.fn(),
    invokeMock: actionInvokeMock,
    openwhiskMock: vi.fn(() => ({
      actions: {
        invoke: actionInvokeMock,
      },
    })),
    runUpdateMock: vi.fn(),
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
    runUpdate: runUpdateMock,
    runValidation: runValidationMock,
  };
});

import { installationRuntimeAction } from "#actions/installation/index";
import { diffConfig } from "#management/upgrade/diff";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import {
  configWithCommerceEventing,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockFailedState,
  createMockInProgressState,
  createMockInstallationContext,
  createMockStepStatus,
  createMockSucceededState,
  createMockValidationResult,
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationHooks } from "#management/installation/workflow/hooks";
import type {
  InProgressInstallationState,
  InstallationState,
  StepStatus,
} from "#management/installation/workflow/types";
import type { CleanupList, UpdatePlan } from "#management/upgrade/types";

/** In-memory mock of a generic key/value store, mirroring the installation store fixture. */
function createMockStore<T>(initialValue: T | null = null) {
  let value = initialValue;

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

type MockStore<T> = ReturnType<typeof createMockStore<T>>;

const { appData } = createMockInstallationContext();
const requestBody = {
  appData,
  commerceBaseUrl: "https://commerce.example.com",
  commerceEnv: "paas",
  ioEventsEnv: "prod",
  ioEventsUrl: "https://events.example.com",
};

describe("installation router — update routes", () => {
  let installationStore: MockStore<InstallationState>;
  let uninstallationStore: MockStore<InstallationState>;
  let planStore: MockStore<UpdatePlan>;
  let updateStore: MockStore<InstallationState>;
  let cleanupStore: MockStore<CleanupList>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.__OW_ACTION_VERSION = "3";

    installationStore = createMockStore<InstallationState>();
    uninstallationStore = createMockStore<InstallationState>();
    planStore = createMockStore<UpdatePlan>();
    updateStore = createMockStore<InstallationState>();
    cleanupStore = createMockStore<CleanupList>();

    createCombinedStoreMock.mockImplementation(
      async (options?: { cache?: { keyPrefix?: string } }) => {
        const prefix = options?.cache?.keyPrefix;

        if (prefix === "installation") {
          return installationStore;
        }
        if (prefix === "uninstallation") {
          return uninstallationStore;
        }
        if (prefix === "update-plan") {
          return planStore;
        }
        if (prefix === "update") {
          return updateStore;
        }
        if (prefix === "update-cleanup") {
          return cleanupStore;
        }

        throw new Error(`Unexpected store prefix: ${String(prefix)}`);
      },
    );

    invokeMock.mockResolvedValue({ activationId: "activation-123" });
    runValidationMock.mockResolvedValue(createMockValidationResult());
  });

  afterEach(() => {
    delete process.env.__OW_ACTION_VERSION;
  });

  describe("POST /update/preview", () => {
    test("returns 409 no-baseline when there is no installation snapshot", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/update/preview",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: {
          body: { code: "no-baseline" },
          statusCode: 409,
        },
        type: "error",
      });
    });

    test("returns the diff, planId, and validation result when a baseline exists", async () => {
      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({
          config: minimalValidConfig,
          id: "installation-1",
        }),
      );

      const validationResult = createMockValidationResult({ valid: false });
      runValidationMock.mockResolvedValue(validationResult);

      // The runtime action is (re)deployed with the new target config baked in
      // as `appConfig` — the same mechanism POST / uses to source the config
      // to install. The old config comes from the recorded installation snapshot.
      const handler = installationRuntimeAction({
        appConfig: configWithCommerceEventing,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/update/preview",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: {
          diff: { changes: expect.any(Array) },
          planId: expect.any(String),
          validation: validationResult,
        },
        type: "success",
      });
    });

    test("stores the plan, stamped with the installation action's deployment version", async () => {
      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({
          config: minimalValidConfig,
          id: "installation-1",
        }),
      );

      const handler = installationRuntimeAction({
        appConfig: configWithCommerceEventing,
      });

      await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/update/preview",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(planStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({
          createdAt: expect.any(String),
          deploymentVersion: "3",
          diff: { changes: expect.any(Array) },
          planId: expect.any(String),
          targetConfig: configWithCommerceEventing,
        }),
      );
    });

    test("overwrites any prior pending plan with a new, distinct planId on a second preview", async () => {
      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({
          config: minimalValidConfig,
          id: "installation-1",
        }),
      );

      const handler = installationRuntimeAction({
        appConfig: configWithCommerceEventing,
      });

      const params = createRuntimeActionParams({
        body: requestBody,
        method: "post",
        path: "/update/preview",
        ...DEFAULT_INSTALLATION_PARAMS,
      });

      const first = await handler(params);
      const firstStoredPlan = await planStore.get("current");

      const second = await handler(params);
      const secondStoredPlan = await planStore.get("current");

      expect(first).toMatchObject({ type: "success" });
      expect(second).toMatchObject({ type: "success" });

      const firstPlanId =
        first.type === "success" ? (first.body?.planId as string) : undefined;
      const secondPlanId =
        second.type === "success" ? (second.body?.planId as string) : undefined;

      expect(firstPlanId).toEqual(firstStoredPlan?.planId);
      expect(secondPlanId).toEqual(secondStoredPlan?.planId);
      expect(secondPlanId).not.toBe(firstPlanId);
      expect(planStore.put).toHaveBeenCalledTimes(2);
    });

    test("does not invoke any external activation (sync, no side effects)", async () => {
      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({
          config: minimalValidConfig,
          id: "installation-1",
        }),
      );

      const handler = installationRuntimeAction({
        appConfig: configWithCommerceEventing,
      });

      await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/update/preview",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(invokeMock).not.toHaveBeenCalled();
    });
  });

  describe("GET /update", () => {
    test("returns 204 when there is no update state", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({ path: "/update" }),
      );

      expect(result).toMatchObject({
        statusCode: 204,
        type: "success",
      });
    });

    test("returns the persisted update state when one exists", async () => {
      const existingState = createMockSucceededState({ id: "update-1" });
      updateStore = createMockStore<InstallationState>(existingState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({ path: "/update" }),
      );

      expect(result).toMatchObject({
        body: existingState,
        type: "success",
      });
    });
  });

  describe("POST /update", () => {
    const updateRequestBody = { ...requestBody, planId: "plan-1" };

    /** Seeds the plan store and returns the plan, so assertions can reference its computed diff. */
    function seedPlan(overrides: Partial<UpdatePlan> = {}): UpdatePlan {
      const plan: UpdatePlan = {
        createdAt: "2026-01-01T00:00:00.000Z",
        deploymentVersion: "3",
        diff: diffConfig(minimalValidConfig, configWithCommerceEventing),
        planId: "plan-1",
        targetConfig: configWithCommerceEventing,
        ...overrides,
      };
      planStore = createMockStore<UpdatePlan>(plan);
      return plan;
    }

    beforeEach(() => {
      seedPlan();
    });

    test("returns 202 and self-invokes /update/execution on a valid, matching, idle request", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: expect.objectContaining({
          activationId: "activation-123",
          id: expect.any(String),
        }),
        statusCode: 202,
        type: "success",
      });

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          blocking: false,
          name: "app-management/installation",
          params: expect.objectContaining({ __ow_path: "/update/execution" }),
          result: false,
        }),
      );
    });

    test("stores the initial update state and seeds the cleanup list from operative changes", async () => {
      const plan = seedPlan();
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(updateStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({ status: "in-progress" }),
      );

      const expectedEntries = plan.diff.changes
        .filter((change) => change.kind !== "unchanged")
        .map((change) => ({
          domain: change.domain,
          identity: change.identity,
        }));

      expect(cleanupStore.put).toHaveBeenCalledWith("current", {
        entries: expectedEntries,
      });
    });

    test("returns 409 plan-mismatch when body.planId does not match the stored plan", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { ...updateRequestBody, planId: "wrong-plan" },
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { code: "plan-mismatch" }, statusCode: 409 },
        type: "error",
      });
    });

    test("returns 409 plan-mismatch when there is no stored plan at all", async () => {
      planStore = createMockStore<UpdatePlan>(null);
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { code: "plan-mismatch" }, statusCode: 409 },
        type: "error",
      });
    });

    test("returns 409 stale when the live deployment version no longer matches the plan", async () => {
      seedPlan({ deploymentVersion: "2" }); // process.env.__OW_ACTION_VERSION is "3"
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { code: "stale" }, statusCode: 409 },
        type: "error",
      });
    });

    test("returns 409 busy when an installation is already in progress", async () => {
      installationStore = createMockStore<InstallationState>(
        createMockInProgressState(),
      );

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { code: "busy" }, statusCode: 409 },
        type: "error",
      });
    });

    test("returns 409 busy when an uninstallation is already in progress", async () => {
      uninstallationStore = createMockStore<InstallationState>(
        createMockInProgressState(),
      );

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { code: "busy" }, statusCode: 409 },
        type: "error",
      });
    });

    test("returns 409 busy when another update is already in progress", async () => {
      updateStore = createMockStore<InstallationState>(
        createMockInProgressState(),
      );

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { code: "busy" }, statusCode: 409 },
        type: "error",
      });
    });

    test("the three 409 error codes are distinct", async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      seedPlan();
      const mismatchResult = await handler(
        createRuntimeActionParams({
          body: { ...updateRequestBody, planId: "wrong-plan" },
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      seedPlan({ deploymentVersion: "999" });
      const staleResult = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      seedPlan();
      installationStore = createMockStore<InstallationState>(
        createMockInProgressState(),
      );
      const busyResult = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      const codes = [mismatchResult, staleResult, busyResult].map((result) =>
        result.type === "error"
          ? (result.error.body as unknown as { code: string }).code
          : undefined,
      );

      expect(codes).toEqual(["plan-mismatch", "stale", "busy"]);
      expect(new Set(codes).size).toBe(3);
    });
  });

  describe("POST /update/execution", () => {
    /** Seeds the plan store and returns the plan, so assertions can reference `targetConfig`/`diff`. */
    function seedPlan(overrides: Partial<UpdatePlan> = {}): UpdatePlan {
      const plan: UpdatePlan = {
        createdAt: "2026-01-01T00:00:00.000Z",
        deploymentVersion: "3",
        diff: diffConfig(minimalValidConfig, configWithCommerceEventing),
        planId: "plan-1",
        targetConfig: configWithCommerceEventing,
        ...overrides,
      };
      planStore = createMockStore<UpdatePlan>(plan);
      return plan;
    }

    function buildInitialState(config: CommerceAppConfigOutputModel) {
      return createMockInProgressState({ config, id: "update-1" });
    }

    beforeEach(() => {
      runUpdateMock.mockImplementation(
        async ({
          initialState,
          hooks,
        }: {
          initialState: InProgressInstallationState;
          hooks: InstallationHooks;
        }) => {
          const succeededState = createMockSucceededState({
            config: initialState.config,
            id: initialState.id,
          });

          await hooks.onInstallationStart?.(initialState);
          await hooks.onInstallationSuccess?.(succeededState);

          return succeededState;
        },
      );
    });

    test("runs runUpdate and persists the succeeded result for a non-empty plan", async () => {
      const plan = seedPlan();
      const initialState = buildInitialState(plan.targetConfig);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(runUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({ initialState, plan }),
      );

      expect(result).toMatchObject({ type: "success" });
      expect(updateStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({ status: "succeeded" }),
      );
    });

    test("advances the installation snapshot and clears the plan + cleanup stores on success", async () => {
      const plan = seedPlan();
      const initialState = buildInitialState(plan.targetConfig);
      cleanupStore = createMockStore<CleanupList>({
        entries: [{ domain: "adminUi", identity: "adminUi" }],
      });

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(installationStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({
          config: plan.targetConfig,
          status: "succeeded",
        }),
      );
      expect(planStore.delete).toHaveBeenCalledWith("current");
      expect(cleanupStore.delete).toHaveBeenCalledWith("current");
    });

    test("returns 500 and does not advance the snapshot when the update workflow fails", async () => {
      const plan = seedPlan();
      const initialState = buildInitialState(plan.targetConfig);
      const failedState = createMockFailedState({ id: initialState.id });

      runUpdateMock.mockResolvedValue(failedState);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
      });
      expect(installationStore.put).not.toHaveBeenCalled();
      expect(planStore.delete).not.toHaveBeenCalled();
    });

    test("version-only plan: succeeds with no reconcile calls, but still advances snapshot and clears stores", async () => {
      const plan = seedPlan({
        diff: diffConfig(minimalValidConfig, minimalValidConfig),
        targetConfig: minimalValidConfig,
      });
      const initialState = buildInitialState(plan.targetConfig);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(runUpdateMock).not.toHaveBeenCalled();
      expect(result).toMatchObject({ type: "success" });

      expect(installationStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({
          config: minimalValidConfig,
          status: "succeeded",
        }),
      );
      expect(planStore.delete).toHaveBeenCalledWith("current");
      expect(cleanupStore.delete).toHaveBeenCalledWith("current");
    });

    test("version-only plan: marks the entire step tree succeeded, not just the top-level status", async () => {
      const plan = seedPlan({
        diff: diffConfig(minimalValidConfig, minimalValidConfig),
        targetConfig: minimalValidConfig,
      });

      // A nested tree with every node still "pending" — proves the fix walks
      // the tree recursively rather than only setting the top-level status.
      const step: StepStatus = createMockStepStatus({
        children: [
          createMockStepStatus({
            children: [
              createMockStepStatus({
                id: "grandchild-1",
                name: "grandchild-1",
                path: ["root", "child-1", "grandchild-1"],
              }),
            ],
            id: "child-1",
            name: "child-1",
            path: ["root", "child-1"],
          }),
          createMockStepStatus({
            id: "child-2",
            name: "child-2",
            path: ["root", "child-2"],
          }),
        ],
      });
      const initialState = createMockInProgressState({
        config: plan.targetConfig,
        id: "update-1",
        step,
      });

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      // GET /update returns the persisted state verbatim — read it back through
      // the same path a real consumer would use to render per-step progress.
      const getResult = await handler(
        createRuntimeActionParams({ path: "/update" }),
      );

      expect(getResult).toMatchObject({ type: "success" });
      const persistedStep =
        getResult.type === "success"
          ? (getResult.body as { step: StepStatus }).step
          : undefined;

      expect(persistedStep).toBeDefined();

      function collectStatuses(node: StepStatus): string[] {
        return [node.status, ...node.children.flatMap(collectStatuses)];
      }

      const statuses = collectStatuses(persistedStep as StepStatus);
      expect(statuses).toHaveLength(4); // root + child-1 + grandchild-1 + child-2
      expect(statuses.every((status) => status === "succeeded")).toBe(true);
    });

    test("version-only plan with pending cleanup entries still runs runUpdate (not a pure no-op)", async () => {
      const plan = seedPlan({
        diff: diffConfig(minimalValidConfig, minimalValidConfig),
        targetConfig: minimalValidConfig,
      });
      const initialState = buildInitialState(plan.targetConfig);
      cleanupStore = createMockStore<CleanupList>({
        entries: [{ domain: "adminUi", identity: "adminUi" }],
      });

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(runUpdateMock).toHaveBeenCalled();
    });
  });
});
