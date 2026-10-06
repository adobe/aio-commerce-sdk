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
  createRootInstallationStepMock,
  getAssociationDataMock,
} = vi.hoisted(() => {
  const actionInvokeMock = vi.fn();

  return {
    createCombinedStoreMock: vi.fn(),
    createRootInstallationStepMock: vi.fn(),
    getAssociationDataMock: vi.fn(),
    invokeMock: actionInvokeMock,
    openwhiskMock: vi.fn(() => ({
      actions: {
        invoke: actionInvokeMock,
      },
    })),
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

import { installationRuntimeAction } from "#actions/installation/index";
import { createRuntimeActionParams } from "#test/fixtures/actions";
import { createMockConfig, minimalValidConfig } from "#test/fixtures/config";
import {
  createMockCombinedStoreImpl,
  createMockInProgressState,
  createMockInstallationContext,
  createMockInstallationStore,
  createMockInstallationSucceededState,
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

const POST_APP_DEPLOY_HEADERS = {
  "x-aio-commerce-installation-invocation-source": "post-app-deploy",
};

const { appData } = createMockInstallationContext();
const requestBody = {
  appData,
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
    getAssociationDataMock.mockResolvedValue({
      commerce: { baseUrl: "https://associated.example.com", env: "saas" },
    });
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
      expect(result).toMatchObject({
        body: {
          id: "attempt-1",
          status: "in-progress",
          step: attempt.progress,
        },
        statusCode: 200,
        type: "success",
      });
      expect(result).not.toMatchObject({
        body: { plan: expect.anything() },
      });
    });

    test("returns the latest lifecycle attempt over the legacy installation record", async () => {
      const attempt = createMockLifecycleAttempt({
        id: "attempt-1",
        operation: "install",
        status: "in-progress",
      });
      orchestrationStateStore = createMockLifecycleStore({
        initial: createMockOrchestrationState({ latestAttempt: attempt }),
      });
      installationStore = createMockInstallationStore(
        createMockInstallationSucceededState(),
      );
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(createRuntimeActionParams({}));

      expect(result).toMatchObject({
        body: { id: "attempt-1", operation: "install" },
        statusCode: 200,
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
          error: {
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
  let desiredUninstallationStore = createMockInstallationStore();
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
        uninstall: { label: "Uninstallation" },
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
              reason: "change",
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
      desiredUninstallationStore = createMockInstallationStore();
      desiredSnapshotStore = createMockLifecycleStore<AppStateSnapshot>();
      desiredStateStore = createMockLifecycleStore<OrchestrationState>();
      createCombinedStoreMock.mockImplementation(
        createMockCombinedStoreImpl(() => ({
          appStateSnapshot: desiredSnapshotStore,
          installation: desiredInstallationStore,
          orchestrationState: desiredStateStore,
          uninstallation: desiredUninstallationStore,
        })),
      );
      seedInstalledBaseline("0.9.0");

      createRootInstallationStepMock.mockReturnValue(createUpgradeRoot());
      getAssociationDataMock.mockResolvedValue({
        commerce: { baseUrl: "https://commerce.example.com", env: "paas" },
      });
      invokeMock.mockResolvedValue({ activationId: "activation-123" });
    });

    type Action = ReturnType<typeof installationRuntimeAction>;

    /** Plans through `POST /plan`. */
    function planRequest(action: Action, body: object = upgradeRequestBody) {
      return action(
        createRuntimeActionParams({
          body,
          method: "post",
          path: "/plan",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );
    }

    /** Starts the plan named by `planId` through `POST /`. */
    function startPlan(
      action: Action,
      planId: string,
      body: object = upgradeRequestBody,
    ) {
      return action(
        createRuntimeActionParams({
          body: { ...body, planId },
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );
    }

    /** Plans, then starts the plan it returns. Returns the planning response when planning fails. */
    async function planAndStart(
      action: Action,
      body: object = upgradeRequestBody,
    ) {
      const planned = await planRequest(action, body);
      if (planned.type !== "success") {
        return planned;
      }

      const { plan } = planned.body as { plan: { id: string } };
      return startPlan(action, plan.id, body);
    }

    async function startAutomaticUpgrade() {
      const action = installationRuntimeAction({
        appConfig: configWithAutoUpgrade,
      });
      const result = await planAndStart(action);
      const attempt = (await desiredStateStore.get("current"))?.latestAttempt;
      expect.assert(attempt, "Expected a persisted upgrade attempt");

      return { action, attemptId: attempt.id, result };
    }

    /** Plans the install and returns the id of the plan it stored. */
    async function validateInstall(action: Action) {
      const result = await planRequest(action, requestBody);
      expect.assert(result.type === "success", "Expected planning to succeed");
      return (result.body as { plan: { id: string } }).plan.id;
    }

    describe("install branch", () => {
      test("dispatches to installation when no completed install exists", async () => {
        desiredInstallationStore = createMockInstallationStore();
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const planId = await validateInstall(action);
        const result = await action(
          createRuntimeActionParams({
            body: { ...requestBody, planId },
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
              AIO_COMMERCE_API_BASE_URL: "https://commerce.example.com",
              AIO_COMMERCE_API_FLAVOR: "paas",
            }),
          }),
        );
        expect(result).toMatchObject({
          body: { operation: "install", status: "pending" },
          statusCode: 202,
          type: "success",
        });
      });

      test("records the installed config as the baseline once the install attempt succeeds", async () => {
        desiredInstallationStore = createMockInstallationStore();
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const planId = await validateInstall(action);
        await action(
          createRuntimeActionParams({
            body: { ...requestBody, planId },
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        const attempt = (await desiredStateStore.get("current"))?.latestAttempt;
        expect.assert(attempt, "Expected a persisted install attempt");

        const result = await action(
          createRuntimeActionParams({
            appData,
            attemptId: attempt.id,
            method: "post",
            path: "/execution",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(result).toMatchObject({
          body: {
            completedAt: expect.any(String),
            operation: "install",
            status: "succeeded",
          },
          statusCode: 200,
        });
        const state = await desiredStateStore.get("current");
        expect(
          state?.baselineSnapshotId &&
            (await desiredSnapshotStore.get(state.baselineSnapshotId))?.config,
        ).toEqual(configWithAutoUpgrade);
        expect(desiredInstallationStore.put).not.toHaveBeenCalled();
      });

      test("returns 409 instead of installing over an install that an older version is running", async () => {
        desiredInstallationStore = createMockInstallationStore(
          createMockInProgressState(),
        );
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await planRequest(action, requestBody);

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "in-progress" }, statusCode: 409 },
        });
      });

      test("returns 409 stale-plan when the plan id is not the validated plan", async () => {
        desiredInstallationStore = createMockInstallationStore();
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        await validateInstall(action);
        const result = await action(
          createRuntimeActionParams({
            body: { ...requestBody, planId: "another-plan" },
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "stale-plan" }, statusCode: 409 },
        });
      });
    });

    describe("plan", () => {
      test("plans the install, stores it for POST / and returns it with the validation result", async () => {
        desiredInstallationStore = createMockInstallationStore();
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: requestBody,
            method: "post",
            path: "/plan",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        const pendingPlan = (await desiredStateStore.get("current"))
          ?.pendingPlan;
        expect(result).toMatchObject({
          body: {
            plan: { id: pendingPlan?.id, issues: [], operation: "install" },
            summary: { errors: 0, totalIssues: 0, warnings: 0 },
            valid: true,
          },
          statusCode: 200,
        });
        expect(invokeMock).not.toHaveBeenCalled();
      });

      test("reports the issues a step's plan validation finds under that step, without blocking", async () => {
        desiredInstallationStore = createMockInstallationStore();
        createRootInstallationStepMock.mockReturnValue(
          createUpgradeRoot(
            createUpgradeLeaf({
              validatePlan: vi.fn().mockResolvedValue([
                {
                  code: "WEBHOOK_CONFLICTS",
                  details: { conflictedWebhooks: [] },
                  message: "Conflict",
                  severity: "warning",
                },
              ]),
            }),
          ),
        );
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await action(
          createRuntimeActionParams({
            body: requestBody,
            method: "post",
            path: "/plan",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );

        expect(result).toMatchObject({
          body: {
            plan: {
              domains: [
                {
                  operations: [{ id: "operation-1", kind: "add" }],
                  path: ["installation", "synthetic"],
                },
              ],
              issues: [
                {
                  blocking: false,
                  code: "WEBHOOK_CONFLICTS",
                  path: ["installation", "synthetic"],
                  severity: "warning",
                },
              ],
            },
            result: {
              children: [
                {
                  issues: [
                    {
                      code: "WEBHOOK_CONFLICTS",
                      details: { conflictedWebhooks: [] },
                      severity: "warning",
                    },
                  ],
                  path: ["installation", "synthetic"],
                },
              ],
            },
            summary: { warnings: 1 },
            valid: false,
          },
        });

        const planId = (result as unknown as { body: { plan: { id: string } } })
          .body.plan.id;
        const started = await action(
          createRuntimeActionParams({
            body: { ...requestBody, planId },
            method: "post",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );
        expect(started).toMatchObject({ statusCode: 202 });
      });

      test("returns 409 in-progress with the running attempt while an attempt runs", async () => {
        const { action, attemptId } = await startAutomaticUpgrade();
        const result = await planRequest(action, requestBody);

        expect(result).toMatchObject({
          error: {
            body: {
              attempt: {
                id: attemptId,
                operation: "upgrade",
                status: "pending",
              },
              reason: "in-progress",
            },
            statusCode: 409,
          },
        });
      });
    });

    describe("upgrade branch", () => {
      test("returns 409 when the app is not associated", async () => {
        getAssociationDataMock.mockResolvedValue(null);
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await planAndStart(action);

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
        const result = await planAndStart(action);

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

      test("returns 409 instead of installing again when the stored state cannot be read", async () => {
        desiredInstallationStore = createMockInstallationStore();
        vi.mocked(desiredStateStore.has).mockResolvedValue(true);
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await planAndStart(action);

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "unreadable-state" }, statusCode: 409 },
          type: "error",
        });
      });

      test("returns 409 when another upgrade attempt is in progress", async () => {
        const { action } = await startAutomaticUpgrade();
        invokeMock.mockClear();

        const result = await planAndStart(action);

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "in-progress" }, statusCode: 409 },
          type: "error",
        });
      });

      test("returns 409 when a simultaneous request replaces the plan before it starts", async () => {
        desiredStateStore = createMockLifecycleStore<OrchestrationState>({
          onPut: (_key, state) => {
            if (state.pendingPlan) {
              state.pendingPlan = { ...state.pendingPlan, id: "other-plan" };
            }
          },
        });
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await planAndStart(action);

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "stale-plan" }, statusCode: 409 },
          type: "error",
        });
      });

      test("returns 409 when the installed version is already current", async () => {
        seedInstalledBaseline(configWithAutoUpgrade.metadata.version);
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await planAndStart(action);

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
        const result = await planAndStart(action);

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

      test("replaces the pending plan on every plan request and never starts it", async () => {
        const action = installationRuntimeAction({
          appConfig: createMockConfig({
            metadata: { upgradeMode: "manual" },
          }),
        });
        await planRequest(action);

        const firstPlan = (await desiredStateStore.get("current"))?.pendingPlan;
        expect.assert(firstPlan, "Expected a pending plan");

        const result = await planRequest(action);
        const state = await desiredStateStore.get("current");
        expect.assert(state?.pendingPlan, "Expected a replaced plan");

        expect(invokeMock).not.toHaveBeenCalled();
        expect(state.pendingPlan.id).not.toBe(firstPlan.id);
        expect(result).toMatchObject({
          body: { plan: { id: state.pendingPlan.id, operation: "upgrade" } },
          statusCode: 200,
          type: "success",
        });
        expect(state.latestAttempt).toBeNull();
      });
      test("starts a reviewed plan in manual mode and records how the new plan differs", async () => {
        const operation = (
          id: string,
          after: unknown,
          reason: "change" | "drift" = "change",
        ) => ({ after, id, kind: "add", label: `Label ${id}`, reason });

        const planned = (operations: ReturnType<typeof operation>[]) => ({
          kind: "planned",
          plan: { operations, path: ["installation", "synthetic"] },
        });

        createRootInstallationStepMock.mockReturnValue(
          createUpgradeRoot(
            createUpgradeLeaf({
              plan: vi
                .fn()
                .mockResolvedValueOnce(
                  planned([
                    operation("kept", { value: 1 }),
                    operation("changed", { value: 1 }),
                    operation("dropped", { value: 1 }),
                  ]),
                )
                .mockResolvedValueOnce(
                  planned([
                    operation("kept", { value: 1 }),
                    operation("changed", { value: 2 }),
                    operation("added", { value: 1 }),
                    operation("hidden", { value: 1 }, "drift"),
                  ]),
                ),
            }),
          ),
        );

        const action = installationRuntimeAction({
          appConfig: createMockConfig({ metadata: { upgradeMode: "manual" } }),
        });
        const request = (body: object) =>
          action(
            createRuntimeActionParams({
              body,
              method: "post",
              ...DEFAULT_INSTALLATION_PARAMS,
            }),
          );

        await planRequest(action);
        const reviewed = (await desiredStateStore.get("current"))?.pendingPlan;
        expect.assert(reviewed, "Expected a pending plan to review");

        const result = await request({
          ...upgradeRequestBody,
          planId: reviewed.id,
        });

        const attempt = (await desiredStateStore.get("current"))?.latestAttempt;
        expect.assert(attempt, "Expected the reviewed plan to start");

        const ref = (id: string) => expect.objectContaining({ id });
        const review = {
          added: [ref("added")],
          changed: [ref("changed")],
          dropped: [ref("dropped")],
          planId: reviewed.id,
        };

        expect(invokeMock).toHaveBeenCalledOnce();
        expect(attempt.plan.id).not.toBe(reviewed.id);
        expect(attempt.review).toEqual(review);
        expect(result).toMatchObject({
          body: { operation: "upgrade", review },
          statusCode: 202,
          type: "success",
        });
      });

      test("returns 409 stale-plan when the installed state no longer calls for the planned operation", async () => {
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const planned = await planRequest(action);
        expect.assert(planned.type === "success", "Expected an upgrade plan");

        const state = await desiredStateStore.get("current");
        expect.assert(state, "Expected a stored state");
        await desiredStateStore.put("current", {
          ...state,
          baselineSnapshotId: null,
        });
        desiredInstallationStore = createMockInstallationStore();

        const { plan } = planned.body as { plan: { id: string } };
        const result = await startPlan(action, plan.id);

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: {
            body: {
              message:
                "The plan is for an upgrade, but the app now needs an install. Call POST /plan again.",
              reason: "stale-plan",
            },
            statusCode: 409,
          },
        });
      });

      test("returns 409 with reason stale-plan when the reviewed plan is no longer pending", async () => {
        const action = installationRuntimeAction({
          appConfig: createMockConfig({ metadata: { upgradeMode: "manual" } }),
        });
        await planRequest(action);
        vi.mocked(desiredStateStore.put).mockClear();
        const result = await startPlan(action, "not-the-pending-plan");

        // Refused before planning again, which would replace the pending plan.
        expect(desiredStateStore.put).not.toHaveBeenCalled();
        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "stale-plan" }, statusCode: 409 },
          type: "error",
        });
      });

      test("returns 409 in-progress with the running attempt when its plan is started again", async () => {
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const planned = await planRequest(action);
        expect.assert(planned.type === "success", "Expected an upgrade plan");

        const { plan } = planned.body as { plan: { id: string } };
        const started = await startPlan(action, plan.id);
        const again = await startPlan(action, plan.id);

        expect(invokeMock).toHaveBeenCalledOnce();
        expect(again).toMatchObject({
          error: {
            body: {
              attempt: {
                id: (started as unknown as { body: { id: string } }).body.id,
                status: "pending",
              },
              reason: "in-progress",
            },
            statusCode: 409,
          },
        });
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
              AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: upgradeRequestBody.ioEventsEnv,
              AIO_EVENTS_API_BASE_URL: upgradeRequestBody.ioEventsUrl,
              attemptId,
            }),
            result: false,
          }),
        );
        expect(result).toMatchObject({
          body: { id: attemptId, operation: "upgrade", status: "pending" },
          statusCode: 202,
          type: "success",
        });
      });

      test("allows retry when background dispatch fails", async () => {
        invokeMock.mockRejectedValueOnce(new Error("OpenWhisk unavailable"));
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });

        const failed = await planAndStart(action);
        expect(failed).toMatchObject({ type: "error" });

        const retried = await planAndStart(action);
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

        expect(retriedAttemptId).not.toBe(firstAttemptId);
      });
    });

    describe("uninstall", () => {
      const removeLeafPlan = {
        kind: "planned",
        plan: {
          operations: [
            {
              before: {},
              id: "remove-1",
              kind: "remove",
              label: "Remove synthetic resource",
              reason: "change",
            },
          ],
          path: ["installation", "synthetic"],
        },
      };

      function useUninstallLeaf(overrides?: Partial<LeafStep>) {
        const leaf = createUpgradeLeaf({
          plan: vi.fn().mockResolvedValue(removeLeafPlan),
          ...overrides,
        });

        createRootInstallationStepMock.mockReturnValue(createUpgradeRoot(leaf));
        return leaf;
      }

      async function startUninstall() {
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });
        const result = await planAndStart(action, {
          ...requestBody,
          operation: "uninstall",
        });

        return { action, result };
      }

      /** The plan of the latest attempt. */
      async function getAttemptPlan() {
        const attempt = (await desiredStateStore.get("current"))?.latestAttempt;
        expect.assert(attempt, "Expected a started attempt");
        return attempt.plan;
      }

      async function executeLatestAttempt(
        action: ReturnType<typeof installationRuntimeAction>,
      ) {
        const attempt = (await desiredStateStore.get("current"))?.latestAttempt;
        expect.assert(attempt, "Expected a started attempt");

        return await action(
          createRuntimeActionParams({
            appData,
            attemptId: attempt.id,
            method: "post",
            path: "/execution",
            ...DEFAULT_INSTALLATION_PARAMS,
          }),
        );
      }

      test("plans from the stored baseline towards nothing and starts the uninstall", async () => {
        const leaf = useUninstallLeaf();
        const { result } = await startUninstall();

        expect(result).toMatchObject({
          body: {
            message: "Uninstallation started",
            operation: "uninstall",
            status: "pending",
          },
          statusCode: 202,
        });
        expect(await getAttemptPlan()).toMatchObject({
          issues: [],
          source: { appVersion: "0.9.0" },
          target: null,
        });
        expect(leaf.plan).toHaveBeenCalledWith(
          expect.objectContaining({
            baseline: expect.objectContaining({
              config: expect.objectContaining({
                metadata: expect.objectContaining({ version: "0.9.0" }),
              }),
            }),
            targetConfig: null,
          }),
          expect.anything(),
        );
        expect(invokeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              __ow_path: "/execution",
              AIO_COMMERCE_API_BASE_URL: "https://commerce.example.com",
            }),
          }),
        );
      });

      test("plans from the deployed config when no baseline is stored", async () => {
        desiredInstallationStore = createMockInstallationStore();
        const leaf = useUninstallLeaf();
        const { result } = await startUninstall();

        expect(result).toMatchObject({ statusCode: 202 });
        expect(await getAttemptPlan()).toMatchObject({
          issues: [
            {
              blocking: false,
              code: "PLANNED_WITHOUT_BASELINE",
              severity: "warning",
            },
          ],
          source: null,
          target: null,
        });
        expect(leaf.plan).toHaveBeenCalledWith(
          expect.objectContaining({
            baseline: expect.objectContaining({
              config: configWithAutoUpgrade,
            }),
            targetConfig: null,
          }),
          expect.anything(),
        );
      });

      test("plans nothing when the baseline snapshot the state names is gone", async () => {
        const leaf = useUninstallLeaf();
        const action = installationRuntimeAction({
          appConfig: configWithAutoUpgrade,
        });

        // Any request migrates the seeded record into a lifecycle baseline.
        await action(createRuntimeActionParams({}));
        const snapshotId = (await desiredStateStore.get("current"))
          ?.baselineSnapshotId;
        expect.assert(snapshotId, "Expected a stored baseline");
        desiredSnapshotStore.values.delete(snapshotId);

        for (const body of [
          requestBody,
          { ...requestBody, operation: "uninstall" },
        ]) {
          // biome-ignore lint/performance/noAwaitInLoops: one plan request per operation
          expect(await planRequest(action, body)).toMatchObject({
            error: { body: { reason: "baseline-missing" }, statusCode: 409 },
          });
        }

        expect(leaf.plan).not.toHaveBeenCalled();
        expect(invokeMock).not.toHaveBeenCalled();
      });

      test("returns 409 while an older library version is uninstalling", async () => {
        desiredUninstallationStore = createMockInstallationStore(
          createMockInProgressState(),
        );
        useUninstallLeaf();
        const { result } = await startUninstall();

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "in-progress" }, statusCode: 409 },
        });
      });

      test("returns 409 not-associated when the app is not associated", async () => {
        getAssociationDataMock.mockResolvedValue(null);
        useUninstallLeaf();
        const { result } = await startUninstall();

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          error: { body: { reason: "not-associated" }, statusCode: 409 },
        });
      });

      test("clears the baseline, keeps its snapshot and deletes the legacy record when the uninstall succeeds", async () => {
        const leaf = useUninstallLeaf();
        const { action } = await startUninstall();
        const baselineSnapshotId = (await desiredStateStore.get("current"))
          ?.baselineSnapshotId;
        expect.assert(baselineSnapshotId, "Expected a stored baseline");

        const result = await executeLatestAttempt(action);

        expect(leaf.apply).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({
          body: { operation: "uninstall", status: "succeeded" },
          statusCode: 200,
        });
        expect(await desiredStateStore.get("current")).toMatchObject({
          baselineSnapshotId: null,
          latestAttempt: { operation: "uninstall", status: "succeeded" },
        });
        expect(
          await desiredSnapshotStore.get(baselineSnapshotId),
        ).not.toBeNull();
        expect(await desiredInstallationStore.get("current")).toBeNull();

        const status = await action(createRuntimeActionParams({ path: "/" }));
        expect(status).toMatchObject({
          body: { operation: "uninstall", status: "succeeded" },
          statusCode: 200,
        });
        expect(status).not.toHaveProperty("body.plan");
      });

      test("keeps the baseline and the legacy record when the uninstall fails", async () => {
        useUninstallLeaf({
          apply: vi.fn().mockRejectedValue(new Error("boom")),
        });
        const { action } = await startUninstall();
        const baselineSnapshotId = (await desiredStateStore.get("current"))
          ?.baselineSnapshotId;

        const result = await executeLatestAttempt(action);

        expect(result).toMatchObject({ error: { statusCode: 500 } });
        expect(
          (await desiredStateStore.get("current"))?.baselineSnapshotId,
        ).toBe(baselineSnapshotId);
        expect(await desiredInstallationStore.get("current")).not.toBeNull();
      });
    });

    describe("upgrade execution", () => {
      test("rejects an attempt created by an older action version and records it as failed", async () => {
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
          failure: { key: "LIFECYCLE_START_FAILED" },
          id: attemptId,
          status: "failed",
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
          path: "/plan",
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
          path: "/plan",
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

    test("returns 409 not-associated when installing an app that is not associated", async () => {
      getAssociationDataMock.mockResolvedValue(null);
      const handler = installationRuntimeAction({
        appConfig: minimalValidConfig,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: requestBody,
          method: "post",
          path: "/plan",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { body: { reason: "not-associated" }, statusCode: 409 },
        type: "error",
      });
      expect(invokeMock).not.toHaveBeenCalled();
    });

    test("returns 400 when installing without a validated plan id", async () => {
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
      expect(result).toMatchObject({ error: { statusCode: 400 } });
    });

    test("returns 500 when installation starts without an app config", async () => {
      const handler = installationRuntimeAction({
        // @ts-expect-error - intentionally missing app config
        appConfig: undefined,
      });

      const result = await handler(
        createRuntimeActionParams({
          body: { ...requestBody, planId: "plan-1" },
          method: "post",
          ...DEFAULT_INSTALLATION_PARAMS,
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 500 },
        type: "error",
      });
    });
  });

  describe("POST /execution", () => {
    test("returns 400 when execution is missing the attempt id", async () => {
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
  });
});
