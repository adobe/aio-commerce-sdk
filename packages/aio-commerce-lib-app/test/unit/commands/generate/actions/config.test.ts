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

import { describe, expect, test } from "vitest";

import { PACKAGE_NAME } from "#commands/constants";
import {
  buildAdminUiV2ExtConfig,
  buildAppManagementExtConfig,
  buildBusinessConfigurationExtConfig,
  collectUniqueRuntimeActions,
  getRuntimeActions,
  requiresWebSource,
} from "#commands/generate/actions/config";
import {
  configWithAdminUiAllGrids,
  configWithAdminUiMenu,
  configWithAdminUiSingleGrid,
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithExternalEventing,
  configWithFullAdminUiV2,
  configWithMultipleWorkerMassActions,
  configWithOrderViewButtons,
  configWithOrderViewTypeButtons,
  configWithOrderWorkerTypeButtons,
  configWithViewMassActions,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";

const EXTENSIBILITY_EXTENSION_MATCHER = /EXTENSION=extensibility\/1/;
const CONFIGURATION_EXTENSION_MATCHER = /EXTENSION=configuration\/1/;
const BACKEND_UI_V2_EXTENSION_MATCHER = /EXTENSION=backend-ui\/2/;

describe("buildAppManagementExtConfig", () => {
  test("app-config action is included with minimal config", () => {
    const result = buildAppManagementExtConfig(minimalValidConfig);

    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;
    expect(actions?.["app-config"]).toBeDefined();
  });

  test("does not include installation action for minimal config", () => {
    const result = buildAppManagementExtConfig(minimalValidConfig);

    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;
    expect(actions?.installation).toBeUndefined();
  });

  test.concurrent.each([
    { label: "commerce eventing", config: configWithCommerceEventing },
    { label: "external eventing", config: configWithExternalEventing },
    {
      label: "custom installation steps",
      config: configWithCustomInstallationSteps,
    },
    { label: "webhooks", config: configWithWebhooks },
    { label: "adminUi", config: configWithViewMassActions },
  ])("includes installation action when $label is configured", ({ config }) => {
    const result = buildAppManagementExtConfig(config);

    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;
    expect(actions?.installation).toBeDefined();
  });

  test.concurrent.each([
    { label: "commerce eventing", config: configWithCommerceEventing },
    { label: "external eventing", config: configWithExternalEventing },
    {
      label: "custom installation steps",
      config: configWithCustomInstallationSteps,
    },
    { label: "webhooks", config: configWithWebhooks },
    { label: "adminUi", config: configWithViewMassActions },
  ])("includes installation workerProcess entry when $label is configured", ({
    config,
  }) => {
    const result = buildAppManagementExtConfig(config);
    const workerImpls =
      result.operations?.workerProcess?.map((worker) => worker.impl) ?? [];

    expect(workerImpls).toContain("app-management/installation");
  });

  test("installation action includes encryption key input when schema has password fields", () => {
    const configWithPassword = {
      ...configWithCommerceEventing,
      businessConfig: {
        schema: [
          {
            name: "secret",
            label: "Secret",
            type: "password" as const,
            default: "" as const,
          },
        ],
      },
    };

    const result = buildAppManagementExtConfig(configWithPassword);
    const installAction =
      result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions?.installation;

    expect(installAction?.inputs?.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY).toBe(
      "$AIO_COMMERCE_CONFIG_ENCRYPTION_KEY",
    );
  });

  test("installation action omits encryption key input when no password fields", () => {
    const result = buildAppManagementExtConfig(configWithCommerceEventing);
    const installAction =
      result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions?.installation;

    expect(
      installAction?.inputs?.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
    ).toBeUndefined();
  });

  test("all actions are web:yes", () => {
    const result = buildAppManagementExtConfig(configWithCommerceEventing);
    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;

    for (const action of Object.values(actions ?? {})) {
      expect(action.web).toBe("yes");
    }
  });

  test("pre-app-build hook uses extensibility/1", () => {
    const result = buildAppManagementExtConfig(configWithCommerceEventing);
    const preBuildHook = result.hooks?.["pre-app-build"] ?? "";

    expect(preBuildHook).toMatch(EXTENSIBILITY_EXTENSION_MATCHER);
  });

  test("declares workerProcess operations for each runtime action", () => {
    const result = buildAppManagementExtConfig(configWithCommerceEventing);
    const workerImpls =
      result.operations?.workerProcess?.map((worker) => worker) ?? [];

    expect(workerImpls).toEqual([
      { type: "action", impl: "app-management/app-config" },
      { type: "action", impl: "app-management/installation" },
    ]);
  });
});

describe("buildAdminUiV2ExtConfig", () => {
  test("pre-app-build hook uses backend-ui/2", () => {
    const config = buildAdminUiV2ExtConfig(configWithFullAdminUiV2);
    const preBuildHook = config.hooks?.["pre-app-build"] ?? "";
    expect(preBuildHook).toMatch(BACKEND_UI_V2_EXTENSION_MATCHER);
  });

  test("declares one workerProcess entry per unique runtimeAction (3 grids)", () => {
    const config = buildAdminUiV2ExtConfig(configWithAdminUiAllGrids);
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toHaveLength(3);
    expect(workerImpls).toContain("orders/fetch-order-grid-data");
    expect(workerImpls).toContain("products/fetch-product-grid-data");
    expect(workerImpls).toContain("customers/fetch-customer-grid-data");
  });

  test("declares one workerProcess entry for single-grid config", () => {
    const config = buildAdminUiV2ExtConfig(configWithAdminUiSingleGrid);
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toHaveLength(1);
    expect(workerImpls).toContain("orders/fetch-order-grid-data");
  });

  test("deduplicates workerProcess when multiple grids share the same runtimeAction", () => {
    const sharedRuntimeAction = "shared/fetch-grid-data";
    const config = buildAdminUiV2ExtConfig({
      ...minimalValidConfig,
      adminUi: {
        order: {
          gridColumns: {
            label: "L",
            description: "D",
            runtimeAction: sharedRuntimeAction,
            columns: [{ id: "k", label: "K", type: "string", align: "left" }],
          },
        },
        customer: {
          gridColumns: {
            label: "L",
            description: "D",
            runtimeAction: sharedRuntimeAction,
            columns: [{ id: "k", label: "K", type: "string", align: "left" }],
          },
        },
      },
    });
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toHaveLength(1);
    expect(workerImpls).toContain(sharedRuntimeAction);
  });

  test("workerProcess is absent when there are no runtime actions", () => {
    const config = buildAdminUiV2ExtConfig(minimalValidConfig);
    expect(config.operations?.workerProcess).toBeUndefined();
  });

  test("worker view buttons produce workerProcess entries", () => {
    const config = buildAdminUiV2ExtConfig(configWithOrderWorkerTypeButtons);
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toContain("orders/sync-inventory");
  });

  test("view view buttons add operations.view pointing at index.html", () => {
    const config = buildAdminUiV2ExtConfig(configWithOrderViewTypeButtons);
    expect(config.operations?.view).toEqual([
      { type: "web", impl: "index.html" },
    ]);
  });

  test("worker view buttons do not add operations.view", () => {
    const config = buildAdminUiV2ExtConfig(configWithOrderWorkerTypeButtons);
    expect(config.operations?.view).toBeUndefined();
  });

  test("mixed view buttons produce both workerProcess and view entries", () => {
    const config = buildAdminUiV2ExtConfig(configWithOrderViewButtons);
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(config.operations?.view).toEqual([
      { type: "web", impl: "index.html" },
    ]);
    expect(workerImpls).toContain("orders/sync-inventory");
  });

  test("deduplicates workerProcess when grid column and view button share the same runtimeAction", () => {
    const sharedAction = "orders/shared-action";
    const config = buildAdminUiV2ExtConfig({
      ...minimalValidConfig,
      adminUi: {
        order: {
          gridColumns: {
            label: "L",
            description: "D",
            runtimeAction: sharedAction,
            columns: [{ id: "k", label: "K", type: "string", align: "left" }],
          },
          viewButtons: [
            {
              type: "worker",
              id: "btn",
              label: "Btn",
              runtimeAction: sharedAction,
            },
          ],
        },
      },
    });
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toHaveLength(1);
    expect(workerImpls).toContain(sharedAction);
  });

  test("includes workerProcess entries for worker mass actions", () => {
    const config = buildAdminUiV2ExtConfig(configWithFullAdminUiV2);
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toContain("customers/export-customers");
    expect(workerImpls).toContain("orders/fetch-order-data");
  });

  test("omits view and web when adminUi has only worker mass actions (no view mass actions)", () => {
    const config = buildAdminUiV2ExtConfig(minimalValidConfig);
    expect(config.operations?.view).toBeUndefined();
    expect(config.web).toBeUndefined();
  });

  test("declares web property when adminUi.menu is present", () => {
    const config = buildAdminUiV2ExtConfig(configWithAdminUiMenu);
    expect(config.web).toBe("web-src");
  });

  test("workerProcess is omitted when adminUi has only menu (no grids or worker mass actions)", () => {
    const config = buildAdminUiV2ExtConfig(configWithAdminUiMenu);
    expect(config.operations?.workerProcess).toBeUndefined();
  });

  test("includes view and web when view mass actions are configured", () => {
    const config = buildAdminUiV2ExtConfig(configWithViewMassActions);
    expect(config.operations?.view).toEqual([
      { type: "web", impl: "index.html" },
    ]);
    expect(config.web).toBe("web-src");
  });

  test("all worker mass action runtimeActions from multiple entities appear in workerProcess", () => {
    const config = buildAdminUiV2ExtConfig(configWithMultipleWorkerMassActions);
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toHaveLength(2);
    expect(workerImpls).toContain("orders/export-orders");
    expect(workerImpls).toContain("customers/export-customers");
  });

  test("deduplicates workerProcess when a grid runtimeAction matches a worker mass action runtimeAction", () => {
    const sharedAction = "orders/fetch-order-data";
    const config = buildAdminUiV2ExtConfig({
      ...minimalValidConfig,
      adminUi: {
        order: {
          gridColumns: {
            label: "L",
            description: "D",
            runtimeAction: sharedAction,
            columns: [
              {
                id: "k",
                label: "K",
                type: "string" as const,
                align: "left" as const,
              },
            ],
          },
          massActions: [
            {
              id: "fetch",
              label: "Fetch",
              type: "worker" as const,
              runtimeAction: sharedAction,
            },
          ],
        },
      },
    });
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toHaveLength(1);
    expect(workerImpls).toContain(sharedAction);
  });

  test("deduplicates workerProcess entries when the same runtimeAction appears on multiple entities", () => {
    const config = buildAdminUiV2ExtConfig({
      ...minimalValidConfig,
      adminUi: {
        order: {
          massActions: [
            {
              id: "app::export",
              label: "Export",
              type: "worker",
              runtimeAction: "pkg/export",
            },
          ],
        },
        customer: {
          massActions: [
            {
              id: "app::export-c",
              label: "Export",
              type: "worker",
              runtimeAction: "pkg/export",
            },
          ],
        },
      },
    });
    const workerImpls =
      config.operations?.workerProcess?.map((op) => op.impl) ?? [];

    expect(workerImpls).toEqual(
      [{ type: "action", impl: "pkg/export" }].map((e) => e.impl),
    );
  });

  test("declares view operation when adminUi.menu is present", () => {
    const config = buildAdminUiV2ExtConfig(configWithAdminUiMenu);
    expect(config.operations?.view).toEqual([
      { type: "web", impl: "index.html" },
    ]);
  });

  test("no view operation when adminUi.menu is absent", () => {
    const config = buildAdminUiV2ExtConfig(configWithAdminUiSingleGrid);
    expect(config.operations?.view).toBeUndefined();
  });

  test("view and workerProcess coexist when multiple extension points are configured", () => {
    const config = buildAdminUiV2ExtConfig(configWithFullAdminUiV2);
    expect(config.operations?.workerProcess).toHaveLength(2);
    expect(config.operations?.view).toEqual([
      { type: "web", impl: "index.html" },
    ]);
  });
});

describe("collectUniqueRuntimeActions", () => {
  test("returns empty array for undefined", () => {
    expect(collectUniqueRuntimeActions(undefined)).toEqual([]);
  });

  test("deduplicates runtimeActions across entities", () => {
    const result = collectUniqueRuntimeActions(
      configWithAdminUiAllGrids.adminUi,
    );
    expect(new Set(result).size).toBe(result.length);
  });

  test("collects all runtimeActions from a realistic adminUi config", () => {
    const result = collectUniqueRuntimeActions(
      configWithAdminUiAllGrids.adminUi,
    );
    expect(result).toContain("orders/fetch-order-grid-data");
    expect(result).toContain("products/fetch-product-grid-data");
    expect(result).toContain("customers/fetch-customer-grid-data");
  });

  test("collects runtimeAction from worker view buttons", () => {
    const result = collectUniqueRuntimeActions(
      configWithOrderWorkerTypeButtons.adminUi,
    );
    expect(result).toContain("orders/sync-inventory");
  });

  test("does not collect from view type buttons (no runtimeAction field)", () => {
    const result = collectUniqueRuntimeActions(
      configWithOrderViewTypeButtons.adminUi,
    );
    expect(result).toEqual([]);
  });
});

describe("requiresWebSource", () => {
  test("returns false for undefined", () => {
    expect(requiresWebSource(undefined)).toBe(false);
  });

  test("returns true when adminUi has a menu", () => {
    expect(requiresWebSource(configWithAdminUiMenu.adminUi)).toBe(true);
  });

  test("returns true for a realistic adminUi config with view type buttons", () => {
    expect(requiresWebSource(configWithOrderViewTypeButtons.adminUi)).toBe(
      true,
    );
  });

  test("returns false for a realistic adminUi config with only worker type buttons", () => {
    expect(requiresWebSource(configWithOrderWorkerTypeButtons.adminUi)).toBe(
      false,
    );
  });

  test("returns false for a grid-only adminUi config", () => {
    expect(requiresWebSource(configWithAdminUiAllGrids.adminUi)).toBe(false);
  });
});

describe("buildBusinessConfigurationExtConfig", () => {
  test("config action is included", () => {
    const result = buildBusinessConfigurationExtConfig();
    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;

    expect(actions?.config).toBeDefined();
  });

  test("scope-tree action is included", () => {
    const result = buildBusinessConfigurationExtConfig();
    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;

    expect(actions?.["scope-tree"]).toBeDefined();
  });

  test("pre-app-build hook uses configuration/1", () => {
    const result = buildBusinessConfigurationExtConfig();
    const preBuildHook = result.hooks?.["pre-app-build"] ?? "";

    expect(preBuildHook).toMatch(CONFIGURATION_EXTENSION_MATCHER);
  });

  test("all actions are web:yes", () => {
    const result = buildBusinessConfigurationExtConfig();
    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;

    for (const action of Object.values(actions ?? {})) {
      expect(action.web).toBe("yes");
    }
  });

  test("declares workerProcess operations for each runtime action", () => {
    const result = buildBusinessConfigurationExtConfig();
    const workerImpls =
      result.operations?.workerProcess?.map((worker) => worker) ?? [];

    expect(workerImpls).toEqual([
      { type: "action", impl: "app-management/config" },
      { type: "action", impl: "app-management/scope-tree" },
    ]);
  });
});

describe("getRuntimeActions", () => {
  test("returns an empty list when the app-management package has no actions", () => {
    expect(getRuntimeActions({}, "app-management")).toEqual([]);
  });
});
