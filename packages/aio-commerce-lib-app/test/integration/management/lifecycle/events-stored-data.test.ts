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

import { toAttemptStatus } from "#actions/installation/lifecycle";
import { getPlanInputs } from "#actions/installation/plan";
import { externalEventsStep } from "#management/domains/events/external";
import {
  getStoredEventProviderKeys,
  pruneStoredEventProviders,
} from "#management/domains/events/utils";
import { executeLifecycleAttempt } from "#management/lifecycle/execution";
import { planLifecycle } from "#management/lifecycle/planning";
import { startLifecycleAttempt } from "#management/lifecycle/start";
import { createMockConfig } from "#test/fixtures/config";
import {
  createMockEventingInstallationContext,
  createMockAppEvent as event,
  createMockExternalEventsConfig as externalConfig,
} from "#test/fixtures/eventing";
import {
  createMockAppStateSnapshot,
  createMockLifecycleRuntime,
} from "#test/fixtures/lifecycle";
import {
  createMockBranchStep,
  createMockLifecycleRoot,
} from "#test/fixtures/workflow";

vi.mock("#management/domains/events/utils", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("#management/domains/events/utils")
  >()),
  getStoredEventProviderKeys: vi.fn(),
  pruneStoredEventProviders: vi.fn(),
}));

const EXECUTION_DEADLINE = "2099-01-01T00:00:00.000Z";

const config = createMockConfig({
  eventing: externalConfig([
    {
      events: [event("ext.created", ["pkg/a"])],
      provider: { description: "d", key: "ext", label: "External" },
    },
  ]).eventing,
  metadata: { id: "synthetic-app", version: "1.0.0" },
});

/** An eventing branch whose clients see no live provider, so the provider is already gone. */
function createEventingRoot() {
  const { ioEventsClient, commerceEventsClient } =
    createMockEventingInstallationContext({
      ioEventsClient: {
        getAllEventProviders: vi
          .fn()
          .mockResolvedValue({ _embedded: { providers: [] } }),
        getAllRegistrations: vi
          .fn()
          .mockResolvedValue({ _embedded: { registrations: [] } }),
      } as never,
    });

  const eventing = createMockBranchStep({
    children: [externalEventsStep],
    context: () => ({ commerceEventsClient, ioEventsClient }),
    meta: {
      install: { label: "Eventing" },
      uninstall: { label: "Eventing" },
      upgrade: { label: "Eventing" },
    },
    name: "eventing",
  });

  return createMockLifecycleRoot([eventing]);
}

function createLifecycle() {
  const { runtime, stateStore } = createMockLifecycleRuntime({
    baseline: createMockAppStateSnapshot({ config, id: "baseline-1" }),
    rootStep: createEventingRoot(),
  });

  /** Plans, starts and executes one uninstall attempt. */
  async function uninstall(activation: string) {
    const planning = await planLifecycle({
      ...runtime,
      ...getPlanInputs("uninstall", config),
      actionVersion: "1.0.0",
      operation: "uninstall",
    });

    const started = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      activationId: `${activation}-start`,
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const executed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      activationId: `${activation}-execute`,
      attemptId: started.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    return { executed, started };
  }

  return { stateStore, uninstall };
}

beforeEach(() => {
  vi.mocked(getStoredEventProviderKeys).mockReset().mockResolvedValue(["ext"]);
  vi.mocked(pruneStoredEventProviders).mockReset().mockResolvedValue();
});

describe("uninstall with the event provider already gone", () => {
  test("removes the stored event data, which the leaf has an operation for", async () => {
    const { uninstall } = createLifecycle();

    const { executed, started } = await uninstall("a1");

    expect(executed.status).toBe("succeeded");
    expect(pruneStoredEventProviders).toHaveBeenCalledWith(["ext"]);
    expect(toAttemptStatus(started).plan.domains).toMatchObject([
      {
        operations: [
          {
            id: "remove:stored-events:ext",
            kind: "remove",
            label: 'Remove stored event data of provider "ext"',
            reason: "change",
          },
        ],
        path: ["root", "eventing", "external"],
      },
    ]);
  });

  test("leaves the stored event data alone when none is stored", async () => {
    vi.mocked(getStoredEventProviderKeys).mockResolvedValue([]);
    const { uninstall } = createLifecycle();

    const { executed, started } = await uninstall("a1");

    expect(executed.status).toBe("succeeded");
    expect(toAttemptStatus(started).plan.domains[0].operations).toEqual([]);
    expect(pruneStoredEventProviders).not.toHaveBeenCalled();
  });

  test("fails the uninstall when the removal fails, and plans and runs it again on the retry", async () => {
    vi.mocked(pruneStoredEventProviders).mockRejectedValueOnce(
      new Error("boom"),
    );
    const { stateStore, uninstall } = createLifecycle();

    const { executed: failed } = await uninstall("a1");

    expect(failed).toMatchObject({
      failure: {
        message: expect.stringContaining("boom"),
        path: ["root", "eventing", "external"],
      },
      status: "failed",
    });
    expect((await stateStore.get("current"))?.baselineSnapshotId).toBe(
      "baseline-1",
    );

    const { executed: retry, started } = await uninstall("a2");

    expect(retry.status).toBe("succeeded");
    expect(toAttemptStatus(started).plan.domains[0].operations).toHaveLength(1);
    expect(pruneStoredEventProviders).toHaveBeenCalledTimes(2);
  });
});
