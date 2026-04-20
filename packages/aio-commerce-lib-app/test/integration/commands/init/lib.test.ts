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

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test, vi } from "vitest";

import {
  APP_CONFIG_FILE,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  INSTALL_YAML_FILE,
  PACKAGE_JSON_FILE,
} from "#commands/constants";
import * as manifestCommand from "#commands/generate/manifest/main";
import { DOMAIN_DEFAULTS } from "#commands/init/constants";
import {
  ensureAppConfig,
  ensureCommerceAppConfig,
  ensureInstallYaml,
  ensurePackageJson,
  runGeneration,
} from "#commands/init/lib";
import { makeTemplateFiles } from "#test/fixtures/commands";
import {
  configWithAdminUiSdk,
  configWithBusinessConfig,
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithExternalEventing,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  businessConfigActionFile,
  EMPTY_PROJECT,
  extensibilityActionFile,
  generatedManifestFile,
  generatedSchemaFile,
  INVALID_PROJECT,
  makeProjectFiles,
  withGeneratedProject,
  withTempProject,
} from "#test/fixtures/project";

import type { InitOptions } from "#commands/init/utils";

describe("commands/init/lib", () => {
  describe("ensureCommerceAppConfig", () => {
    test("returns existing valid CJS config without creating a new one", async () => {
      await withTempFiles(
        makeProjectFiles(minimalValidConfig, "cjs"),
        async (tempDir) => {
          const result = await ensureCommerceAppConfig(tempDir);
          expect(result.config).toEqual(minimalValidConfig);
        },
      );
    });

    test("returns existing valid ESM config without creating a new one", async () => {
      await withTempFiles(
        makeProjectFiles(minimalValidConfig, "esm"),
        async (tempDir) => {
          const result = await ensureCommerceAppConfig(tempDir);
          expect(result.config).toEqual(minimalValidConfig);
        },
      );
    });

    test("creates a JS config file when none exists and options are provided", async () => {
      const options: InitOptions = {
        appName: "Test App",
        configFormat: "js",
        domains: ["businessConfig.schema"],
      };

      await withTempFiles(EMPTY_PROJECT, async (tempDir) => {
        const result = await ensureCommerceAppConfig(tempDir, options);

        expect(result.config.metadata.id).toBe("test-app");
        expect(result.config.metadata.displayName).toBe("Test App");
        expect(result.config.businessConfig).toBeDefined();
        expect(result.domains).toContain("businessConfig.schema");

        const content = await readFile(
          join(tempDir, "app.commerce.config.js"),
          "utf-8",
        );
        expect(content).toContain("test-app");
        expect(content).toContain("businessConfig");
      });
    });

    test("creates a TypeScript config when ts format is specified", async () => {
      const options: InitOptions = {
        appName: "TS App",
        configFormat: "ts",
        domains: [],
      };

      await withTempFiles(EMPTY_PROJECT, async (tempDir) => {
        const result = await ensureCommerceAppConfig(tempDir, options);

        expect(result.config.metadata.id).toBe("ts-app");
        expect(result.config.metadata.displayName).toBe("TS App");

        const content = await readFile(
          join(tempDir, "app.commerce.config.ts"),
          "utf-8",
        );
        expect(content).toContain("export default");
      });
    });

    test("includes selected domain defaults in generated config", async () => {
      const options: InitOptions = {
        appName: "Full App",
        configFormat: "ts",
        domains: [
          "businessConfig.schema",
          "eventing.commerce",
          "eventing.external",
          "installation.customInstallationSteps",
        ],
      };

      await withTempFiles(EMPTY_PROJECT, async (tempDir) => {
        const result = await ensureCommerceAppConfig(tempDir, options);

        expect(result.config.businessConfig?.schema).toEqual(
          DOMAIN_DEFAULTS.businessConfig.schema,
        );
        expect(result.config.eventing?.commerce).toEqual(
          DOMAIN_DEFAULTS["eventing.commerce"],
        );
        expect(result.config.eventing?.external).toEqual(
          DOMAIN_DEFAULTS["eventing.external"],
        );
        expect(result.config.installation?.customInstallationSteps).toEqual(
          DOMAIN_DEFAULTS["installation.customInstallationSteps"],
        );
      });
    });

    test("throws when existing config is invalid", async () => {
      await withTempFiles(INVALID_PROJECT, async (tempDir) => {
        await expect(ensureCommerceAppConfig(tempDir)).rejects.toThrow();
      });
    });
  });

  describe("ensureAppConfig", () => {
    test("creates app.config.yaml with extensibility extension point", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          await ensureAppConfig(new Set(), tempDir);

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
          await ensureAppConfig(new Set(["businessConfig.schema"]), tempDir);

          const content = await readFile(
            join(tempDir, APP_CONFIG_FILE),
            "utf-8",
          );
          expect(content).toContain(CONFIGURATION_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("does not duplicate extension points on repeated calls", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [APP_CONFIG_FILE]: "" },
        async (tempDir) => {
          const domains = new Set<never>();
          await ensureAppConfig(domains, tempDir);
          await ensureAppConfig(domains, tempDir);

          const content = await readFile(
            join(tempDir, APP_CONFIG_FILE),
            "utf-8",
          );

          const matches = content.match(
            new RegExp(EXTENSIBILITY_EXTENSION_POINT_ID, "g"),
          );
          expect(matches).toHaveLength(1);
        },
      );
    });

    test("throws with a manual-fix hint when app.config.yaml is unreadable", async () => {
      // Stage a directory at the app.config.yaml path to force readFile → EISDIR.
      await withTempFiles(
        { ...EMPTY_PROJECT, [`${APP_CONFIG_FILE}/.keep`]: "" },
        async (tempDir) => {
          await expect(ensureAppConfig(new Set(), tempDir)).rejects.toThrow(
            new RegExp(`Failed to parse ${APP_CONFIG_FILE}`),
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
          await ensureInstallYaml(new Set(), tempDir);
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
          await ensureInstallYaml(new Set(["businessConfig.schema"]), tempDir);
          const content = await readFile(
            join(tempDir, INSTALL_YAML_FILE),
            "utf-8",
          );

          expect(content).toContain(CONFIGURATION_EXTENSION_POINT_ID);
          expect(content).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        },
      );
    });

    test("does not duplicate extension points on repeated calls", async () => {
      await withTempFiles(
        { ...EMPTY_PROJECT, [INSTALL_YAML_FILE]: "" },
        async (tempDir) => {
          const domains = new Set<never>();
          await ensureInstallYaml(domains, tempDir);
          await ensureInstallYaml(domains, tempDir);

          const content = await readFile(
            join(tempDir, INSTALL_YAML_FILE),
            "utf-8",
          );

          const matches = content.match(
            new RegExp(EXTENSIBILITY_EXTENSION_POINT_ID, "g"),
          );

          expect(matches).toHaveLength(1);
        },
      );
    });

    test("throws with a manual-fix hint when install.yaml is unreadable", async () => {
      // Stage a directory at the install.yaml path to force readFile → EISDIR.
      await withTempFiles(
        { ...EMPTY_PROJECT, [`${INSTALL_YAML_FILE}/.keep`]: "" },
        async (tempDir) => {
          await expect(ensureInstallYaml(new Set(), tempDir)).rejects.toThrow(
            new RegExp(`Failed to parse ${INSTALL_YAML_FILE}`),
          );
        },
      );
    });
  });

  describe("ensurePackageJson", () => {
    test("creates package.json with postinstall script when missing", async () => {
      await withTempFiles({}, async (tempDir) => {
        await ensurePackageJson(tempDir);

        const written = JSON.parse(
          await readFile(join(tempDir, PACKAGE_JSON_FILE), "utf-8"),
        );
        expect(written.scripts.postinstall).toBe(
          "npx aio-commerce-lib-app hooks postinstall",
        );
      });
    });

    test("adds postinstall script when package.json has no postinstall", async () => {
      await withTempProject(EMPTY_PROJECT, async (tempDir) => {
        await ensurePackageJson(tempDir);

        const written = JSON.parse(
          await readFile(join(tempDir, PACKAGE_JSON_FILE), "utf-8"),
        );
        expect(written.scripts.postinstall).toBe(
          "npx aio-commerce-lib-app hooks postinstall",
        );
      });
    });

    test("leaves package.json untouched when postinstall is already configured", async () => {
      const original = JSON.stringify({
        type: "module",
        scripts: { postinstall: "npx aio-commerce-lib-app hooks postinstall" },
      });

      await withTempProject(
        { [PACKAGE_JSON_FILE]: original },
        async (tempDir) => {
          await ensurePackageJson(tempDir);

          const after = await readFile(
            join(tempDir, PACKAGE_JSON_FILE),
            "utf-8",
          );
          expect(after).toBe(original);
        },
      );
    });

    test("appends to an existing different postinstall script", async () => {
      const packageJson = JSON.stringify({
        type: "module",
        scripts: { postinstall: "echo hello" },
      });

      await withTempProject(
        { [PACKAGE_JSON_FILE]: packageJson },
        async (tempDir) => {
          await ensurePackageJson(tempDir);

          const written = JSON.parse(
            await readFile(join(tempDir, PACKAGE_JSON_FILE), "utf-8"),
          );
          expect(written.scripts.postinstall).toBe(
            "echo hello && npx aio-commerce-lib-app hooks postinstall",
          );
        },
      );
    });
  });

  describe("runGeneration", () => {
    test("always generates the app-config action and manifest", async () => {
      await withGeneratedProject(minimalValidConfig, (tempDir) => {
        expect(existsSync(extensibilityActionFile(tempDir, "app-config"))).toBe(
          true,
        );
        expect(existsSync(generatedManifestFile(tempDir))).toBe(true);
      });
    });

    test("does not generate installation or business config actions for a minimal config", async () => {
      await withGeneratedProject(minimalValidConfig, (tempDir) => {
        expect(
          existsSync(extensibilityActionFile(tempDir, "installation")),
        ).toBe(false);
        expect(existsSync(businessConfigActionFile(tempDir, "config"))).toBe(
          false,
        );
        expect(
          existsSync(businessConfigActionFile(tempDir, "scope-tree")),
        ).toBe(false);
        expect(existsSync(generatedSchemaFile(tempDir))).toBe(false);
      });
    });

    test.each([
      {
        domain: "installation.customInstallationSteps",
        config: configWithCustomInstallationSteps,
      },
      { domain: "eventing.commerce", config: configWithCommerceEventing },
      { domain: "eventing.external", config: configWithExternalEventing },
      { domain: "webhooks", config: configWithWebhooks },
      { domain: "adminUiSdk", config: configWithAdminUiSdk },
    ])("generates the installation action when $domain is configured", async ({
      config,
    }) => {
      await withGeneratedProject(config, (tempDir) => {
        expect(
          existsSync(extensibilityActionFile(tempDir, "installation")),
        ).toBe(true);
      });
    });

    test("generates business configuration actions and schema when businessConfig.schema is configured", async () => {
      await withGeneratedProject(configWithBusinessConfig, (tempDir) => {
        expect(existsSync(businessConfigActionFile(tempDir, "config"))).toBe(
          true,
        );
        expect(
          existsSync(businessConfigActionFile(tempDir, "scope-tree")),
        ).toBe(true);
        expect(existsSync(generatedSchemaFile(tempDir))).toBe(true);
      });
    });

    test("throws when an underlying generator fails", async () => {
      const spy = vi
        .spyOn(manifestCommand, "run")
        .mockRejectedValueOnce(new Error("boom"));

      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async () => {
          await expect(
            runGeneration(configWithBusinessConfig, "npx"),
          ).rejects.toThrow();
        },
      );

      spy.mockRestore();
    });
  });
});
