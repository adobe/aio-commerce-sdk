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

import { ADMIN_UI_SDK_ACTIONS_PATH } from "#commands/constants";
import {
  buildAdminUiSdkExtConfig,
  buildAppManagementExtConfig,
} from "#commands/generate/actions/config";
import {
  configWithAdminUiSdk,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("buildAdminUiSdkExtConfig", () => {
  test("returns the correct ext config structure", () => {
    const config = buildAdminUiSdkExtConfig();

    expect(config.hooks?.["pre-app-build"]).toContain("backend-ui/1");
    expect(
      config.runtimeManifest?.packages?.["admin-ui-sdk"]?.actions?.registration
        ?.function,
    ).toContain("registration/index.js");
    expect(
      config.runtimeManifest?.packages?.["admin-ui-sdk"]?.actions?.registration
        ?.annotations?.["require-adobe-auth"],
    ).toBe(true);
  });

  test("registration action function path uses ADMIN_UI_SDK_ACTIONS_PATH", () => {
    const config = buildAdminUiSdkExtConfig();
    const fnPath =
      config.runtimeManifest?.packages?.["admin-ui-sdk"]?.actions?.registration
        ?.function;

    expect(fnPath).toBe(`${ADMIN_UI_SDK_ACTIONS_PATH}/index.js`);
  });

  test("registration action has web: yes and runtime: nodejs:22", () => {
    const config = buildAdminUiSdkExtConfig();
    const action =
      config.runtimeManifest?.packages?.["admin-ui-sdk"]?.actions?.registration;

    expect(action?.web).toBe("yes");
    expect(action?.runtime).toBe("nodejs:22");
  });

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
});

describe("buildAppManagementExtConfig — adminUiSdk", () => {
  test("does not include installation action when adminUiSdk is not configured", () => {
    const config = buildAppManagementExtConfig(minimalValidConfig);
    const actions =
      config.runtimeManifest?.packages?.["app-management"]?.actions ?? {};

    expect(Object.keys(actions)).not.toContain("installation");
  });

  test("includes installation action when adminUiSdk is configured", () => {
    const config = buildAppManagementExtConfig(configWithAdminUiSdk);
    const actions =
      config.runtimeManifest?.packages?.["app-management"]?.actions ?? {};

    expect(Object.keys(actions)).toContain("installation");
  });

  test("includes installation workerProcess entry when adminUiSdk is configured", () => {
    const config = buildAppManagementExtConfig(configWithAdminUiSdk);
    const workerImpls =
      config.operations?.workerProcess?.map((w) => w.impl) ?? [];

    expect(workerImpls).toContain("app-management/installation");
  });
});
