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

import { planAdminUi } from "#management/domains/admin-ui/plan";
import { createMockAdminUiContext } from "#test/fixtures/admin-ui";
import {
  configWithAdminUiAllGrids,
  configWithAdminUiEmptyBlock,
  configWithAdminUiSingleGrid,
} from "#test/fixtures/config";

import type { AdminUiConfig } from "#config/schema/admin-ui";

const OPERATION_PATH = ["admin-ui", "register-extension"];

describe("planAdminUi", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function planInput(
    baselineConfig: AdminUiConfig | null,
    targetConfig: AdminUiConfig | null,
  ) {
    return {
      baseline: baselineConfig
        ? { config: baselineConfig, data: { extensionId: "ext-123" } }
        : null,
      path: OPERATION_PATH,
      targetConfig,
    };
  }

  async function planned(
    baselineConfig: AdminUiConfig | null,
    targetConfig: AdminUiConfig | null,
  ) {
    const context = createMockAdminUiContext({});
    const result = await planAdminUi(
      planInput(baselineConfig, targetConfig),
      context,
    );
    if (result.kind !== "planned") {
      throw new Error("expected a planned result");
    }
    return { context, plan: result.plan };
  }

  test("registers with one add per component when the baseline had no Admin UI", async () => {
    const { plan } = await planned(
      null,
      configWithAdminUiSingleGrid as AdminUiConfig,
    );

    expect(plan.extensionAction).toBe("register");
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]?.kind).toBe("add");
    expect(plan.operations[0]?.id).toBe("add:order.grid-columns");
  });

  test("unregisters with one remove per component when the target dropped Admin UI", async () => {
    const { plan } = await planned(
      configWithAdminUiSingleGrid as AdminUiConfig,
      null,
    );

    expect(plan.extensionAction).toBe("unregister");
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]?.kind).toBe("remove");
    expect(plan.operations[0]?.id).toBe("remove:order.grid-columns");
  });

  test("refreshes with an add per newly added component", async () => {
    const { plan } = await planned(
      configWithAdminUiSingleGrid as AdminUiConfig,
      configWithAdminUiAllGrids as AdminUiConfig,
    );

    expect(plan.extensionAction).toBe("refresh");
    expect(plan.operations).toHaveLength(2);
    expect(plan.operations.every((op) => op.kind === "add")).toBe(true);
    expect(
      plan.operations.map((op) => op.id).sort((a, b) => a.localeCompare(b)),
    ).toEqual(["add:customer.grid-columns", "add:product.grid-columns"]);
  });

  test("refreshes with a remove per dropped component", async () => {
    const { plan } = await planned(
      configWithAdminUiAllGrids as AdminUiConfig,
      configWithAdminUiSingleGrid as AdminUiConfig,
    );

    expect(plan.extensionAction).toBe("refresh");
    expect(plan.operations).toHaveLength(2);
    expect(plan.operations.every((op) => op.kind === "remove")).toBe(true);
    expect(
      plan.operations.map((op) => op.id).sort((a, b) => a.localeCompare(b)),
    ).toEqual(["remove:customer.grid-columns", "remove:product.grid-columns"]);
  });

  test("plans nothing when the components are unchanged", async () => {
    const { plan } = await planned(
      configWithAdminUiSingleGrid as AdminUiConfig,
      configWithAdminUiSingleGrid as AdminUiConfig,
    );

    expect(plan.extensionAction).toBeNull();
    expect(plan.operations).toEqual([]);
  });

  test("plans nothing for a modification to an existing component (owned by CEXT-6510)", async () => {
    const modifiedSingleGrid = {
      ...configWithAdminUiSingleGrid,
      adminUi: {
        ...configWithAdminUiSingleGrid.adminUi,
        order: {
          ...configWithAdminUiSingleGrid.adminUi.order,
          gridColumns: {
            ...configWithAdminUiSingleGrid.adminUi.order.gridColumns,
            label: "Renamed order fulfillment columns",
          },
        },
      },
    } as AdminUiConfig;

    const { plan } = await planned(
      configWithAdminUiSingleGrid as AdminUiConfig,
      modifiedSingleGrid,
    );

    expect(plan.extensionAction).toBeNull();
    expect(plan.operations).toEqual([]);
  });

  test("plans nothing when Admin UI is absent on both sides", async () => {
    const { plan } = await planned(null, null);

    expect(plan.extensionAction).toBeNull();
    expect(plan.operations).toEqual([]);
  });

  test("registers or unregisters an adminUi block with no enumerable components, via a block-level operation", async () => {
    // The schema allows an all-optional block, so `adminUi: {}` is valid yet
    // enumerates to zero components. The block's presence still (un)registers
    // the extension in Commerce, so this must not silently no-op — a dropped
    // empty block would otherwise leak the registration forever, since no
    // later plan would ever see a component change to catch it.
    const emptyAdminUi = configWithAdminUiEmptyBlock as AdminUiConfig;

    const added = await planned(null, emptyAdminUi);
    expect(added.plan.extensionAction).toBe("register");
    expect(added.plan.operations).toHaveLength(1);
    expect(added.plan.operations[0]).toMatchObject({
      id: "add:extension",
      kind: "add",
    });

    const dropped = await planned(emptyAdminUi, null);
    expect(dropped.plan.extensionAction).toBe("unregister");
    expect(dropped.plan.operations).toHaveLength(1);
    expect(dropped.plan.operations[0]).toMatchObject({
      id: "remove:extension",
      kind: "remove",
    });
  });

  test("plans nothing when the block is empty and unchanged on both sides", async () => {
    const emptyAdminUi = configWithAdminUiEmptyBlock as AdminUiConfig;

    const { plan } = await planned(emptyAdminUi, emptyAdminUi);
    expect(plan.extensionAction).toBeNull();
    expect(plan.operations).toEqual([]);
  });

  test("refreshes (does not re-register) when the baseline block was empty but present, and the target adds a component", async () => {
    // An empty-but-present baseline block was still registered in Commerce
    // (registerExtensionStep.install runs whenever adminUi is defined), so
    // gaining a component there is a refresh, not a first-time register.
    const emptyAdminUi = configWithAdminUiEmptyBlock as AdminUiConfig;

    const { plan } = await planned(
      emptyAdminUi,
      configWithAdminUiSingleGrid as AdminUiConfig,
    );

    expect(plan.extensionAction).toBe("refresh");
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]?.kind).toBe("add");
  });

  test("blocks (does not throw) when work is planned but __OW_NAMESPACE is unavailable", async () => {
    vi.unstubAllEnvs();
    const context = createMockAdminUiContext({});
    const result = await planAdminUi(
      planInput(null, configWithAdminUiSingleGrid as AdminUiConfig),
      context,
    );

    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") {
      return;
    }
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.domain).toBe("admin-ui");
    expect(result.issues[0]?.code).toBe("admin-ui-namespace-unavailable");
  });

  test("does not block a no-op plan when __OW_NAMESPACE is unavailable", async () => {
    vi.unstubAllEnvs();
    const context = createMockAdminUiContext({});
    const result = await planAdminUi(planInput(null, null), context);

    expect(result.kind).toBe("planned");
  });

  test("carries the baseline's extensionId forward on the plan, or null when there is no baseline", async () => {
    const noBaseline = await planned(
      null,
      configWithAdminUiSingleGrid as AdminUiConfig,
    );
    expect(noBaseline.plan.baselineExtensionId).toBeNull();

    const withBaseline = await planned(
      configWithAdminUiSingleGrid as AdminUiConfig,
      configWithAdminUiAllGrids as AdminUiConfig,
    );
    expect(withBaseline.plan.baselineExtensionId).toBe("ext-123");
  });

  test("makes no external calls during planning", async () => {
    const { context } = await planned(
      configWithAdminUiSingleGrid as AdminUiConfig,
      configWithAdminUiAllGrids as AdminUiConfig,
    );

    expect(context.adminUiClient.enableAdminUiSdk).not.toHaveBeenCalled();
    expect(context.adminUiClient.registerExtension).not.toHaveBeenCalled();
    expect(context.adminUiClient.refreshExtension).not.toHaveBeenCalled();
    expect(context.adminUiClient.unregisterExtension).not.toHaveBeenCalled();
  });
});
