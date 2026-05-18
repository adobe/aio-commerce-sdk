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
  buildAdminUiSdkExtConfig,
  buildAppManagementExtConfig,
  buildBusinessConfigurationExtConfig,
  getRuntimeActions,
} from "#commands/generate/actions/config";
import {
  configWithAdminUiSdk,
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithExternalEventing,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";

const EXTENSIBILITY_EXTENSION_MATCHER = /EXTENSION=extensibility\/1/;
const CONFIGURATION_EXTENSION_MATCHER = /EXTENSION=configuration\/1/;
const BACKEND_UI_EXTENSION_MATCHER = /EXTENSION=backend-ui\/1/;

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
    { label: "adminUiSdk", config: configWithAdminUiSdk },
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
    { label: "adminUiSdk", config: configWithAdminUiSdk },
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

describe("buildAdminUiSdkExtConfig", () => {
  test("declares operations.view entry for the admin UI iframe", () => {
    const config = buildAdminUiSdkExtConfig();
    expect(config.operations?.view).toEqual([
      { type: "web", impl: "index.html" },
    ]);
  });

  test("declares top-level web source directory", () => {
    const config = buildAdminUiSdkExtConfig();
    expect(config.web).toBe("web-src");
  });

  test("registration action has web: yes", () => {
    const config = buildAdminUiSdkExtConfig();
    const action =
      config.runtimeManifest?.packages?.["admin-ui-sdk"]?.actions?.registration;

    expect(action?.web).toBe("yes");
  });

  test("pre-app-build hook uses backend-ui/1", () => {
    const result = buildAdminUiSdkExtConfig();
    const preBuildHook = result.hooks?.["pre-app-build"] ?? "";

    expect(preBuildHook).toMatch(BACKEND_UI_EXTENSION_MATCHER);
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
