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

const { createCombinedStoreMock, getAssociationDataMock, invokeMock } =
  vi.hoisted(() => ({
    createCombinedStoreMock: vi.fn(),
    getAssociationDataMock: vi.fn(),
    invokeMock: vi.fn(),
  }));

vi.mock("@aio-commerce-sdk/common-utils/storage", () => ({
  createCombinedStore: createCombinedStoreMock,
}));

vi.mock("openwhisk", () => ({
  default: vi.fn(() => ({ actions: { invoke: invokeMock } })),
}));

vi.mock("#management/association/repository", () => ({
  getAssociationData: getAssociationDataMock,
}));

import { installationRuntimeAction } from "#actions/installation/index";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import { configWithOneScript } from "#test/fixtures/config";
import {
  createMockCombinedStoreImpl,
  createMockInstallationContext,
  createMockInstallationStore,
  DEFAULT_INSTALLATION_PARAMS,
} from "#test/fixtures/installation";
import { createMockLifecycleStore } from "#test/fixtures/lifecycle";

import type {
  AppStateSnapshot,
  LifecyclePlan,
  OrchestrationState,
} from "#management/common/orchestration";

const { appData } = createMockInstallationContext();
const requestBody = {
  appData,
  commerceBaseUrl: "https://commerce.example.com",
  commerceEnv: "paas",
  ioEventsEnv: "prod",
  ioEventsUrl: "https://events.example.com",
};

describe("installation action first install", () => {
  let snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
  let stateStore = createMockLifecycleStore<OrchestrationState>();
  let installScript = vi.fn();

  function createAction() {
    installScript = vi.fn().mockResolvedValue({ provisioned: true });

    return installationRuntimeAction({
      appConfig: configWithOneScript,
      customScriptsLoader: () => ({ "./my-script.js": installScript }),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("__OW_ACTION_VERSION", "7");
    vi.stubEnv("__OW_DEADLINE", "4070908800000");

    snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
    stateStore = createMockLifecycleStore<OrchestrationState>();
    createCombinedStoreMock.mockImplementation(
      createMockCombinedStoreImpl(() => ({
        appStateSnapshot: snapshotStore,
        installation: createMockInstallationStore(),
        orchestrationState: stateStore,
        uninstallation: createMockInstallationStore(),
      })),
    );

    invokeMock.mockResolvedValue({ activationId: "activation-1" });
    getAssociationDataMock.mockResolvedValue({
      commerce: { baseUrl: "https://commerce.example.com", env: "paas" },
    });
  });

  test("plans, applies, and becomes the baseline of the next reconciliation", async () => {
    const action = createAction();

    const started = await action(
      createRuntimeActionParams({
        body: requestBody,
        method: "post",
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(started).toMatchObject({
      body: { operation: "install" },
      statusCode: 202,
      type: "success",
    });

    expect.assert(
      started.type === "success",
      "Expected the install to be accepted",
    );
    const { plan } = started.body as { plan: LifecyclePlan };
    const operations = plan.domains.flatMap((domain) => domain.operations);

    expect(plan.source).toBeNull();
    expect(operations.length).toBeGreaterThan(0);
    expect(operations.every((operation) => operation.kind === "add")).toBe(
      true,
    );

    const dispatched = invokeMock.mock.calls.at(0)?.at(0) as {
      params: Record<string, unknown>;
    };

    const executed = await action(
      createRuntimeActionParams({
        ...(dispatched.params as Record<string, never>),
        method: "post",
        path: "/execution",
      }),
    );

    expect(executed).toMatchObject({
      body: { operation: "install", status: "succeeded" },
      statusCode: 200,
      type: "success",
    });
    expect(installScript).toHaveBeenCalledOnce();

    const committed = await stateStore.get("current");
    expect.assert(
      committed?.baselineSnapshotId,
      "Expected a committed baseline snapshot",
    );
    expect(await snapshotStore.get(committed.baselineSnapshotId)).toMatchObject(
      {
        config: { metadata: { id: configWithOneScript.metadata.id } },
      },
    );

    // With a baseline recorded, the same request now reconciles as an upgrade.
    const reconciled = await action(
      createRuntimeActionParams({
        body: requestBody,
        method: "post",
        ...DEFAULT_INSTALLATION_PARAMS,
      }),
    );

    expect(reconciled).toMatchObject({
      error: { body: { reason: "already-current" }, statusCode: 409 },
      type: "error",
    });
    expect(getAssociationDataMock).toHaveBeenCalledOnce();
  });
});
