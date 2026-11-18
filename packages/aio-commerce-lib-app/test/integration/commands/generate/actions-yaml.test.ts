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

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

import {
  APP_CONFIG_FILE,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  INSTALL_YAML_FILE,
} from "#commands/constants";
import {
  ensureAppConfig,
  ensureInstallYaml,
} from "#commands/generate/actions/lib";
import {
  configWithAdminUiAclOnly,
  configWithAdminUiMenu,
  configWithBusinessConfig,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  EMPTY_PROJECT,
  makeAppConfigFile,
  ORDERED_EXTENSION_POINTS,
} from "#test/fixtures/project";

async function readAppConfigIds(tempDir: string) {
  const content = await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8");
  return Object.keys(parse(content).extensions);
}

describe("commands/generate/actions yaml entries", () => {
  describe("ensureAppConfig", () => {
    test("creates app.config.yaml with extensibility extension point", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(new Set(), minimalValidConfig, tempDir);

          const content = await readFile(
            join(tempDir, APP_CONFIG_FILE),
            "utf-8",
          );
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("adds configuration extension point when businessConfig.schema is in domains", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(
            new Set(["businessConfig.schema"]),
            configWithBusinessConfig,
            tempDir,
          );

          const content = await readFile(
            join(tempDir, APP_CONFIG_FILE),
            "utf-8",
          );
          expect(content).toContain(CONFIGURATION_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("adds backend-ui extension point when config has backend-ui components", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(new Set(), configWithAdminUiMenu, tempDir);

          const content = await readFile(
            join(tempDir, APP_CONFIG_FILE),
            "utf-8",
          );
          expect(content).toContain(BACKEND_UI_V2_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("does not add backend-ui extension point for an acl-only config", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(new Set(), configWithAdminUiAclOnly, tempDir);

          const content = await readFile(
            join(tempDir, APP_CONFIG_FILE),
            "utf-8",
          );
          expect(content).not.toContain(BACKEND_UI_V2_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("does not duplicate extension points on repeated calls", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(new Set(), minimalValidConfig, tempDir);
          await ensureAppConfig(new Set(), minimalValidConfig, tempDir);

          const content = await readFile(
            join(tempDir, APP_CONFIG_FILE),
            "utf-8",
          );

          const matches = content.match(
            new RegExp(EXTENSIBILITY_EXTENSION_POINT_ID, "gu"),
          );
          expect(matches).toHaveLength(1);
        },
      );
    });

    test("writes no blank line before extensions and keeps blank lines between entries", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "name: app\n" },
        async (tempDir) => {
          await ensureAppConfig(
            new Set(["businessConfig.schema"]),
            configWithBusinessConfig,
            tempDir,
          );

          expect(
            await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8"),
          ).toBe(`name: app
extensions:
  # This extension is required for business configuration. Do not remove.
  commerce/configuration/1:
    $include: src/commerce-configuration-1/ext.config.yaml

  # This extension is required for app management. Do not remove.
  commerce/extensibility/1:
    $include: src/commerce-extensibility-1/ext.config.yaml
`);
        },
      );
    });

    test("writes the exact output into an empty app.config.yaml", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(
            new Set(["businessConfig.schema"]),
            { ...configWithBusinessConfig, ...configWithAdminUiMenu },
            tempDir,
          );

          expect(
            await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8"),
          ).toBe(`extensions:
  # This extension is required for Admin UI. Do not remove.
  commerce/backend-ui/2:
    $include: src/commerce-backend-ui-2/ext.config.yaml

  # This extension is required for business configuration. Do not remove.
  commerce/configuration/1:
    $include: src/commerce-configuration-1/ext.config.yaml

  # This extension is required for app management. Do not remove.
  commerce/extensibility/1:
    $include: src/commerce-extensibility-1/ext.config.yaml
`);
        },
      );
    });

    test("does not add a blank line before extensions or lose entry spacing when reordering", async () => {
      await withTempFiles(
        {
          ...EMPTY_PROJECT,
          [APP_CONFIG_FILE]: `name: app
extensions:
  # This extension is required for app management. Do not remove.
  commerce/extensibility/1:
    $include: src/commerce-extensibility-1/ext.config.yaml

  # This extension is required for business configuration. Do not remove.
  commerce/configuration/1:
    $include: src/commerce-configuration-1/ext.config.yaml
`,
        },
        async (tempDir) => {
          await ensureAppConfig(
            new Set(["businessConfig.schema"]),
            configWithBusinessConfig,
            tempDir,
          );

          expect(
            await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8"),
          ).toBe(`name: app
extensions:
  # This extension is required for business configuration. Do not remove.
  commerce/configuration/1:
    $include: src/commerce-configuration-1/ext.config.yaml

  # This extension is required for app management. Do not remove.
  commerce/extensibility/1:
    $include: src/commerce-extensibility-1/ext.config.yaml
`);
        },
      );
    });

    test("writes all extension points in the required order", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(
            new Set(["businessConfig.schema"]),
            { ...configWithBusinessConfig, ...configWithAdminUiMenu },
            tempDir,
          );

          expect(await readAppConfigIds(tempDir)).toEqual(
            ORDERED_EXTENSION_POINTS,
          );
        },
      );
    });

    test("keeps the relative order for a subset of extension points", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(
            new Set(["businessConfig.schema"]),
            configWithBusinessConfig,
            tempDir,
          );

          expect(await readAppConfigIds(tempDir)).toEqual([
            CONFIGURATION_EXTENSION_POINT_ID,
            EXTENSIBILITY_EXTENSION_POINT_ID,
          ]);
        },
      );
    });

    test("reorders extension points that are already in the file", async () => {
      await withTempFiles(
        {
          ...EMPTY_PROJECT,
          ...makeAppConfigFile([
            EXTENSIBILITY_EXTENSION_POINT_ID,
            CONFIGURATION_EXTENSION_POINT_ID,
          ]),
        },
        async (tempDir) => {
          await ensureAppConfig(
            new Set(["businessConfig.schema"]),
            { ...configWithBusinessConfig, ...configWithAdminUiMenu },
            tempDir,
          );

          expect(await readAppConfigIds(tempDir)).toEqual(
            ORDERED_EXTENSION_POINTS,
          );
        },
      );
    });

    test("throws with a manual-fix hint when app.config.yaml is unreadable", async () => {
      // Stage a directory at the app.config.yaml path to force readFile → EISDIR.
      await withTempFiles(
        { ...EMPTY_PROJECT, [`${APP_CONFIG_FILE}/.keep`]: "" },
        async (tempDir) => {
          await expect(
            ensureAppConfig(new Set(), minimalValidConfig, tempDir),
          ).rejects.toThrow(
            new RegExp(`Failed to parse ${APP_CONFIG_FILE}`, "u"),
          );
        },
      );
    });
  });

  describe("ensureInstallYaml", () => {
    test("creates install.yaml with extensibility extension point", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [INSTALL_YAML_FILE]: "" },
        async (tempDir) => {
          await ensureInstallYaml(new Set(), minimalValidConfig, tempDir);
          const content = await readFile(
            join(tempDir, INSTALL_YAML_FILE),
            "utf-8",
          );

          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("adds configuration extension point when businessConfig.schema is in domains", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [INSTALL_YAML_FILE]: "" },
        async (tempDir) => {
          await ensureInstallYaml(
            new Set(["businessConfig.schema"]),
            configWithBusinessConfig,
            tempDir,
          );
          const content = await readFile(
            join(tempDir, INSTALL_YAML_FILE),
            "utf-8",
          );

          expect(content).toContain(CONFIGURATION_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("adds backend-ui extension point when config has backend-ui components", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [INSTALL_YAML_FILE]: "" },
        async (tempDir) => {
          await ensureInstallYaml(new Set(), configWithAdminUiMenu, tempDir);
          const content = await readFile(
            join(tempDir, INSTALL_YAML_FILE),
            "utf-8",
          );

          expect(content).toContain(BACKEND_UI_V2_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("does not add backend-ui extension point for an acl-only config", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [INSTALL_YAML_FILE]: "" },
        async (tempDir) => {
          await ensureInstallYaml(new Set(), configWithAdminUiAclOnly, tempDir);
          const content = await readFile(
            join(tempDir, INSTALL_YAML_FILE),
            "utf-8",
          );

          expect(content).not.toContain(BACKEND_UI_V2_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("does not duplicate extension points on repeated calls", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [INSTALL_YAML_FILE]: "" },
        async (tempDir) => {
          await ensureInstallYaml(new Set(), minimalValidConfig, tempDir);
          await ensureInstallYaml(new Set(), minimalValidConfig, tempDir);

          const content = await readFile(
            join(tempDir, INSTALL_YAML_FILE),
            "utf-8",
          );

          const matches = content.match(
            new RegExp(EXTENSIBILITY_EXTENSION_POINT_ID, "gu"),
          );

          expect(matches).toHaveLength(1);
        },
      );
    });

    test("writes no blank line before extensions and keeps blank lines between entries", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [INSTALL_YAML_FILE]: "name: app\n" },
        async (tempDir) => {
          await ensureInstallYaml(
            new Set(["businessConfig.schema"]),
            configWithBusinessConfig,
            tempDir,
          );

          expect(
            await readFile(join(tempDir, INSTALL_YAML_FILE), "utf-8"),
          ).toBe(`name: app
extensions:
  # This extension is required for business configuration. Do not remove.
  - extensionPointId: commerce/configuration/1

  # This extension is required for app management. Do not remove.
  - extensionPointId: commerce/extensibility/1
`);
        },
      );
    });

    test("throws with a manual-fix hint when install.yaml is unreadable", async () => {
      // Stage a directory at the install.yaml path to force readFile → EISDIR.
      await withTempFiles(
        { ...EMPTY_PROJECT, [`${INSTALL_YAML_FILE}/.keep`]: "" },
        async (tempDir) => {
          await expect(
            ensureInstallYaml(new Set(), minimalValidConfig, tempDir),
          ).rejects.toThrow(
            new RegExp(`Failed to parse ${INSTALL_YAML_FILE}`, "u"),
          );
        },
      );
    });
  });
});
