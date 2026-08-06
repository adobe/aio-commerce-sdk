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
  runUpdateMock,
  runValidationMock,
  getAssociationDataMock,
  createEmStatusClientMock,
  writeUpdateStatusMock,
} = vi.hoisted(() => {
  const actionInvokeMock = vi.fn();

  return {
    createCombinedStoreMock: vi.fn(),
    createEmStatusClientMock: vi.fn(),
    getAssociationDataMock: vi.fn(),
    invokeMock: actionInvokeMock,
    openwhiskMock: vi.fn(() => ({
      actions: {
        invoke: actionInvokeMock,
      },
    })),
    runUpdateMock: vi.fn(),
    runValidationMock: vi.fn(),
    writeUpdateStatusMock: vi.fn(),
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

// Mocked so update-routes tests never hit the real state/files storage layer
// (association data) or attempt a real network call (EM status writes).
vi.mock("#management/association/repository", () => ({
  getAssociationData: getAssociationDataMock,
}));

vi.mock("#management/upgrade/em-status-client", () => ({
  createEmStatusClient: createEmStatusClientMock,
}));

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
import type {
  CleanupEntry,
  CleanupList,
  ConfigDiff,
  UpdatePlan,
} from "#management/upgrade/types";

/** The extensionId returned by the default (present) association-data mock. */
const TEST_EXTENSION_ID = "test-extension-id";

/** A minimal diff with a single destructive `removed` businessConfig entry. */
const DESTRUCTIVE_DIFF: ConfigDiff = {
  changes: [
    {
      before: { label: "Old Field", type: "text" },
      destructive: true,
      domain: "businessConfig",
      identity: "oldField",
      kind: "removed",
      supported: true,
    },
  ],
};

/**
 * A diff mixing one SUPPORTED `added` change with one UNSUPPORTED `changed` change
 * (a Commerce subscription, per `unsupportedOnChange: true`) — the shape that used to
 * partially apply then throw mid-reconcile.
 */
const MIXED_UNSUPPORTED_DIFF: ConfigDiff = {
  changes: [
    {
      after: { name: "newWebhook" },
      destructive: false,
      domain: "commerceWebhook",
      identity: "newWebhook",
      kind: "added",
      supported: true,
    },
    {
      after: { name: "changedSub" },
      before: { name: "changedSub" },
      destructive: false,
      domain: "commerceSubscription",
      identity: "changedSub",
      kind: "changed",
      supported: false,
    },
  ],
};

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

    writeUpdateStatusMock.mockReset().mockResolvedValue(undefined);
    createEmStatusClientMock
      .mockReset()
      .mockReturnValue({ writeUpdateStatus: writeUpdateStatusMock });
    getAssociationDataMock.mockReset().mockResolvedValue({
      commerce: { baseUrl: "https://commerce.example.com", env: "paas" },
      extensionId: TEST_EXTENSION_ID,
    });
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

    test("stores the plan, targeting the new config", async () => {
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

    test("merges (unions) the new plan's operative changes into an existing cleanup list rather than overwriting it", async () => {
      // Simulates a prior update (e.g. update A, adding webhook "staleWebhook")
      // that failed after creating the resource but before the snapshot/plan
      // advanced — leaving its cleanup entry behind for the next update to pick up.
      const priorEntry: CleanupEntry = {
        domain: "commerceWebhook",
        identity: "staleWebhook",
      };
      cleanupStore = createMockStore<CleanupList>({ entries: [priorEntry] });

      // A different plan (update B) that does not touch "staleWebhook" at all.
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

      const newEntries = plan.diff.changes
        .filter((change) => change.kind !== "unchanged")
        .map((change) => ({
          domain: change.domain,
          identity: change.identity,
        }));

      const putEntries = cleanupStore.put.mock.calls.at(-1)?.[1]
        ?.entries as CleanupList["entries"];

      // Union: the prior entry survives alongside the new plan's entries.
      expect(putEntries).toEqual(
        expect.arrayContaining([priorEntry, ...newEntries]),
      );
      expect(putEntries).toHaveLength(newEntries.length + 1);
    });

    test("de-dupes when the new plan's operative changes overlap an existing cleanup entry by domain+identity", async () => {
      const sharedEntry: CleanupEntry = {
        domain: "commerceWebhook",
        identity: "newWebhook",
      };
      cleanupStore = createMockStore<CleanupList>({ entries: [sharedEntry] });

      const overlappingDiff: ConfigDiff = {
        changes: [
          {
            after: { name: "newWebhook" },
            destructive: false,
            domain: "commerceWebhook",
            identity: "newWebhook",
            kind: "added",
            supported: true,
          },
        ],
      };
      seedPlan({ diff: overlappingDiff });

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

      expect(cleanupStore.put).toHaveBeenCalledWith("current", {
        entries: [sharedEntry],
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

    test("returns 409 stale when the live app's declared version no longer matches the plan's target version", async () => {
      // The live (currently deployed) config declares a newer version than the
      // one the plan's targetConfig was computed against — i.e. the app was
      // redeployed since the plan was previewed.
      const redeployedConfig: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        metadata: { ...minimalValidConfig.metadata, version: "2.0.0" },
      };
      seedPlan(); // plan.targetConfig.metadata.version is "1.0.0"
      const handler = installationRuntimeAction({
        appConfig: redeployedConfig,
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

    test("the four 409 error codes are distinct", async () => {
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

      seedPlan({
        targetConfig: {
          ...configWithCommerceEventing,
          metadata: {
            ...configWithCommerceEventing.metadata,
            version: "999.0.0",
          },
        },
      });
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

      installationStore = createMockStore<InstallationState>();
      seedPlan({ diff: MIXED_UNSUPPORTED_DIFF });
      const unsupportedResult = await handler(
        createRuntimeActionParams({
          body: updateRequestBody,
          method: "post",
          path: "/update",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      const codes = [
        mismatchResult,
        staleResult,
        busyResult,
        unsupportedResult,
      ].map((result) =>
        result.type === "error"
          ? (result.error.body as unknown as { code: string }).code
          : undefined,
      );

      expect(codes).toEqual(["plan-mismatch", "stale", "busy", "unsupported"]);
      expect(new Set(codes).size).toBe(4);
    });

    test("returns 409 unsupported and does not self-invoke or seed the cleanup list when the plan mixes a supported change with an unsupported one", async () => {
      seedPlan({ diff: MIXED_UNSUPPORTED_DIFF });
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
        error: { body: { code: "unsupported" }, statusCode: 409 },
        type: "error",
      });

      // Fail-fast: no self-invoke, no cleanup-list seeding, no update state created.
      expect(invokeMock).not.toHaveBeenCalled();
      expect(cleanupStore.put).not.toHaveBeenCalled();
      expect(updateStore.put).not.toHaveBeenCalled();
    });

    test("a destructive plan is NOT blocked on the manual path — it self-invokes execution like any other plan", async () => {
      seedPlan({ diff: DESTRUCTIVE_DIFF });
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
        body: expect.objectContaining({ activationId: "activation-123" }),
        statusCode: 202,
        type: "success",
      });

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ __ow_path: "/update/execution" }),
        }),
      );

      // The consent guards above (plan-mismatch/stale/busy) may still report
      // to the EM, but the destructive-change check itself no longer exists
      // on this path, so nothing writes UPDATE_REVIEW_REQUIRED here.
      expect(writeUpdateStatusMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: "UPDATE_REVIEW_REQUIRED" }),
      );
    });
  });

  describe("POST /update/execution", () => {
    /** Seeds the plan store and returns the plan, so assertions can reference `targetConfig`/`diff`. */
    function seedPlan(overrides: Partial<UpdatePlan> = {}): UpdatePlan {
      const plan: UpdatePlan = {
        createdAt: "2026-01-01T00:00:00.000Z",
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

    test("a destructive plan is not blocked — reconcile runs and UPDATING is written, not UPDATE_REVIEW_REQUIRED", async () => {
      const plan = seedPlan({ diff: DESTRUCTIVE_DIFF });
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

      expect(writeUpdateStatusMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: "UPDATE_REVIEW_REQUIRED" }),
      );
      expect(writeUpdateStatusMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "UPDATING" }),
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

    test("writes UPDATING then INSTALLED (with version), in order, on success", async () => {
      const plan = seedPlan();
      const initialState = buildInitialState(plan.targetConfig);

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

      expect(writeUpdateStatusMock).toHaveBeenCalledTimes(2);
      expect(writeUpdateStatusMock.mock.calls[0]?.[0]).toMatchObject({
        extensionId: TEST_EXTENSION_ID,
        status: "UPDATING",
      });
      expect(writeUpdateStatusMock.mock.calls[1]?.[0]).toMatchObject({
        extensionId: TEST_EXTENSION_ID,
        status: "INSTALLED",
        version: plan.targetConfig.metadata.version,
      });
    });

    test("writes UPDATING then UPDATE_FAILED (with the error), in order, when the update workflow fails", async () => {
      const plan = seedPlan();
      const initialState = buildInitialState(plan.targetConfig);
      const failedState = createMockFailedState({ id: initialState.id });
      runUpdateMock.mockResolvedValue(failedState);

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

      expect(writeUpdateStatusMock).toHaveBeenCalledTimes(2);
      expect(writeUpdateStatusMock.mock.calls[0]?.[0]).toMatchObject({
        extensionId: TEST_EXTENSION_ID,
        status: "UPDATING",
      });
      expect(writeUpdateStatusMock.mock.calls[1]?.[0]).toMatchObject({
        error: { message: failedState.error.message },
        extensionId: TEST_EXTENSION_ID,
        status: "UPDATE_FAILED",
      });
    });

    test("skips the Extension Manager write and still succeeds when no extensionId is on record", async () => {
      getAssociationDataMock.mockResolvedValue({
        commerce: { baseUrl: "https://commerce.example.com", env: "paas" },
      });

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

      expect(result).toMatchObject({ type: "success" });
      expect(writeUpdateStatusMock).not.toHaveBeenCalled();
    });

    test("still completes the update when an Extension Manager write throws (best-effort)", async () => {
      writeUpdateStatusMock.mockRejectedValue(
        new Error("EM endpoint unavailable"),
      );

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

      expect(result).toMatchObject({ type: "success" });
      expect(writeUpdateStatusMock).toHaveBeenCalled();
    });

    test("still completes the update when resolving the extensionId (getAssociationData) rejects", async () => {
      getAssociationDataMock.mockRejectedValue(
        new Error("association storage unavailable"),
      );

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

      expect(result).toMatchObject({ type: "success" });
      expect(writeUpdateStatusMock).not.toHaveBeenCalled();
    });

    test("execution uses an inline plan without touching the plan store", async () => {
      seedPlan({ planId: "manual-A" });
      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({
          config: minimalValidConfig,
          id: "installation-1",
        }),
      );

      const inlinePlan: UpdatePlan = {
        createdAt: "2026-01-02T00:00:00.000Z",
        diff: { changes: [] },
        planId: "auto-B",
        targetConfig: configWithCommerceEventing,
      };
      const initialState = buildInitialState(inlinePlan.targetConfig);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          plan: inlinePlan,
          trigger: "auto",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({ type: "success" });
      expect(planStore.get).not.toHaveBeenCalled();
      expect(planStore.delete).not.toHaveBeenCalled();
      await expect(planStore.get("current")).resolves.toMatchObject({
        planId: "manual-A",
      });

      expect(installationStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({ config: inlinePlan.targetConfig }),
      );
    });

    test("auto version-only with unchanged version suppresses the INSTALLED EM write", async () => {
      const installedConfig = configWithCommerceEventing;
      const targetConfig = minimalValidConfig; // same metadata.version, different content

      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({
          config: installedConfig,
          id: "installation-1",
        }),
      );

      const inlinePlan: UpdatePlan = {
        createdAt: "2026-01-02T00:00:00.000Z",
        diff: { changes: [] },
        planId: "auto-same-version",
        targetConfig,
      };
      const initialState = buildInitialState(inlinePlan.targetConfig);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          plan: inlinePlan,
          trigger: "auto",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({ type: "success" });
      expect(writeUpdateStatusMock).toHaveBeenCalledTimes(1);
      expect(writeUpdateStatusMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "UPDATING" }),
      );
      expect(writeUpdateStatusMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: "INSTALLED" }),
      );
    });

    test("auto version-only with a version bump still writes INSTALLED", async () => {
      const installedConfig = configWithCommerceEventing;
      const targetConfig: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        metadata: { ...minimalValidConfig.metadata, version: "2.0.0" },
      };

      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({
          config: installedConfig,
          id: "installation-1",
        }),
      );

      const inlinePlan: UpdatePlan = {
        createdAt: "2026-01-02T00:00:00.000Z",
        diff: { changes: [] },
        planId: "auto-version-bump",
        targetConfig,
      };
      const initialState = buildInitialState(inlinePlan.targetConfig);

      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          appData,
          initialState,
          method: "post",
          path: "/update/execution",
          plan: inlinePlan,
          trigger: "auto",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({ type: "success" });
      expect(writeUpdateStatusMock).toHaveBeenCalledTimes(2);
      expect(writeUpdateStatusMock.mock.calls[0]?.[0]).toMatchObject({
        status: "UPDATING",
      });
      expect(writeUpdateStatusMock.mock.calls[1]?.[0]).toMatchObject({
        status: "INSTALLED",
        version: targetConfig.metadata.version,
      });
    });
  });

  describe("POST /update/self", () => {
    /** The "deployed" target config used by the self-update tests, unless overridden. */
    const autoTargetConfig: CommerceAppConfigOutputModel = {
      ...configWithCommerceEventing,
      metadata: { ...configWithCommerceEventing.metadata, updateType: "auto" },
    };

    /** The recorded installation snapshot's config — no eventing configured yet. */
    const autoOldConfig: CommerceAppConfigOutputModel = {
      ...minimalValidConfig,
      metadata: { ...minimalValidConfig.metadata, updateType: "auto" },
    };

    /** Seeds the installation store with a completed snapshot for `autoOldConfig`. */
    function seedInstalledSnapshot(
      config: CommerceAppConfigOutputModel = autoOldConfig,
    ) {
      installationStore = createMockStore<InstallationState>(
        createMockSucceededState({ config, id: "installation-1" }),
      );
    }

    /** A config whose businessConfig field the target config below removes (destructive). */
    const destructiveOldConfig: CommerceAppConfigOutputModel = {
      ...autoOldConfig,
      businessConfig: {
        schema: [
          { default: "x", label: "Old Field", name: "oldField", type: "text" },
        ],
      },
    };

    /** The webhook entry whose runtimeAction the target config below changes in place (unsupported). */
    const unsupportedOldWebhook = {
      category: "modification" as const,
      description: "Webhook for order created",
      label: "Order Created Webhook",
      requireAdobeAuth: true,
      runtimeAction: "my-package/handle-webhook-old",
      webhook: {
        batch_name: "default",
        hook_name: "order_created",
        method: "POST",
        webhook_method: "plugin.order.api.order_created",
        webhook_type: "after",
      },
    } satisfies NonNullable<CommerceAppConfigOutputModel["webhooks"]>[number];

    const unsupportedOldConfig: CommerceAppConfigOutputModel = {
      ...autoOldConfig,
      webhooks: [unsupportedOldWebhook],
    };
    const unsupportedTargetConfig: CommerceAppConfigOutputModel = {
      ...unsupportedOldConfig,
      webhooks: [
        {
          ...unsupportedOldWebhook,
          runtimeAction: "my-package/handle-webhook-new",
        },
      ],
    };

    test('returns skipped-manual when the target config\'s updateType is not "auto"', async () => {
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig, // mockMetadata.updateType is "manual"
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: { code: "skipped-manual" },
        type: "success",
      });
      expect(invokeMock).not.toHaveBeenCalled();
      expect(writeUpdateStatusMock).not.toHaveBeenCalled();
    });

    test("returns skipped-not-installed when there is no installation snapshot", async () => {
      const handler = installationRuntimeAction({
        appConfig: autoOldConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: { code: "skipped-not-installed" },
        type: "success",
      });
      expect(invokeMock).not.toHaveBeenCalled();
    });

    test("returns 409 busy when an update is already in progress", async () => {
      seedInstalledSnapshot();
      updateStore = createMockStore<InstallationState>(
        createMockInProgressState(),
      );

      const handler = installationRuntimeAction({
        appConfig: autoTargetConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { code: "busy" }, statusCode: 409 },
        type: "error",
      });
      expect(invokeMock).not.toHaveBeenCalled();
    });

    test("destructive plan halts to review-required and writes UPDATE_REVIEW_REQUIRED", async () => {
      seedInstalledSnapshot(destructiveOldConfig);

      const handler = installationRuntimeAction({
        appConfig: autoOldConfig, // removes businessConfig.schema[0] ("oldField")
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: { code: "review-required" },
        type: "success",
      });
      expect(invokeMock).not.toHaveBeenCalled();
      expect(writeUpdateStatusMock).toHaveBeenCalledTimes(1);
      expect(writeUpdateStatusMock).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionId: TEST_EXTENSION_ID,
          status: "UPDATE_REVIEW_REQUIRED",
        }),
      );
    });

    test("unsupported changed resource halts and writes UPDATE_FAILED", async () => {
      seedInstalledSnapshot(unsupportedOldConfig);

      const handler = installationRuntimeAction({
        appConfig: unsupportedTargetConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: { code: "unsupported" },
        type: "success",
      });
      expect(invokeMock).not.toHaveBeenCalled();
      expect(writeUpdateStatusMock).toHaveBeenCalledTimes(1);
      expect(writeUpdateStatusMock).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionId: TEST_EXTENSION_ID,
          status: "UPDATE_FAILED",
        }),
      );
    });

    test("reconcilable plan seeds cleanup and self-invokes execution with an inline plan + auto trigger", async () => {
      seedInstalledSnapshot();

      const handler = installationRuntimeAction({
        appConfig: autoTargetConfig, // adds a supported commerce eventing source
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        body: expect.objectContaining({
          activationId: "activation-123",
          code: "started",
          id: expect.any(String),
          status: "in-progress",
        }),
        statusCode: 202,
        type: "success",
      });

      expect(invokeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          blocking: false,
          name: "app-management/installation",
          params: expect.objectContaining({
            __ow_path: "/update/execution",
            AIO_COMMERCE_API_BASE_URL: "https://commerce.example.com",
            plan: expect.objectContaining({ targetConfig: autoTargetConfig }),
            trigger: "auto",
          }),
          result: false,
        }),
      );

      const diff = diffConfig(autoOldConfig, autoTargetConfig);
      const expectedEntries = diff.changes
        .filter((change) => change.kind !== "unchanged")
        .map((change) => ({
          domain: change.domain,
          identity: change.identity,
        }));

      expect(cleanupStore.put).toHaveBeenCalledWith(
        "current",
        expect.objectContaining({
          entries: expect.arrayContaining(expectedEntries),
        }),
      );
    });

    test("500 when there is no association data to self-source the Commerce base URL from", async () => {
      seedInstalledSnapshot();
      getAssociationDataMock.mockResolvedValue(null);

      const handler = installationRuntimeAction({
        appConfig: autoTargetConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
      });
      expect(invokeMock).not.toHaveBeenCalled();

      // Regression guard: the self-source failure must be checked before any
      // store mutation, so the update/cleanup stores are left untouched, not
      // wedged in-progress/seeded.
      expect(await updateStore.get("current")).toBeNull();
      expect(await cleanupStore.get("current")).toBeNull();
    });

    test("500 when the association record exists but has an empty Commerce base URL", async () => {
      seedInstalledSnapshot();
      getAssociationDataMock.mockResolvedValue({
        commerce: { baseUrl: "", env: "paas" },
        extensionId: TEST_EXTENSION_ID,
      });

      const handler = installationRuntimeAction({
        appConfig: autoTargetConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { appData },
          method: "post",
          path: "/update/self",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
      });
      expect(invokeMock).not.toHaveBeenCalled();
      expect(await updateStore.get("current")).toBeNull();
      expect(await cleanupStore.get("current")).toBeNull();
    });
  });
});
