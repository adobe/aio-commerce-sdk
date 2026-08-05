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
    runValidation: runValidationMock,
  };
});

import { installationRuntimeAction } from "#actions/installation/index";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import {
  configWithCommerceEventing,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockInstallationContext,
  createMockSucceededState,
  createMockValidationResult,
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";

import type { InstallationState } from "#management/installation/workflow/types";
import type { UpdatePlan } from "#management/upgrade/types";

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
  let planStore: MockStore<UpdatePlan>;
  let updateStore: MockStore<InstallationState>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.__OW_ACTION_VERSION = "3";

    installationStore = createMockStore<InstallationState>();
    planStore = createMockStore<UpdatePlan>();
    updateStore = createMockStore<InstallationState>();

    createCombinedStoreMock.mockImplementation(
      async (options?: { cache?: { keyPrefix?: string } }) => {
        const prefix = options?.cache?.keyPrefix;

        if (prefix === "installation") {
          return installationStore;
        }
        if (prefix === "update-plan") {
          return planStore;
        }
        if (prefix === "update") {
          return updateStore;
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
});
