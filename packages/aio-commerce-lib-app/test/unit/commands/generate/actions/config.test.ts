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
import { buildAppManagementExtConfig } from "#commands/generate/actions/config";
import {
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithExternalEventing,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("buildAppManagementExtConfig", () => {
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
  ])("includes installation action when $label is configured", ({ config }) => {
    const result = buildAppManagementExtConfig(config);

    const actions = result.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions;
    expect(actions?.installation).toBeDefined();
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
});
