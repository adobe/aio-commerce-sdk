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

import {
  APP_CONFIG_FILE,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  INSTALL_YAML_FILE,
} from "#commands/constants";
import {
  ensureAppConfig,
  ensureCommerceAppConfig,
  ensureInstallYaml,
} from "#commands/init/lib";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  EMPTY_PROJECT,
  INVALID_PROJECT,
  makeProjectFiles,
} from "#test/fixtures/project";

import type { InitOptions } from "#commands/init/utils";

describe.concurrent("commands/init/lib", () => {
  describe.concurrent("ensureCommerceAppConfig", () => {
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

        expect(result.config.businessConfig).toBeDefined();
        expect(result.config.eventing?.commerce).toBeDefined();
        expect(result.config.eventing?.external).toBeDefined();
        expect(
          result.config.installation?.customInstallationSteps,
        ).toBeDefined();
      });
    });

    test("throws when existing config is invalid", async () => {
      await withTempFiles(INVALID_PROJECT, async (tempDir) => {
        await expect(ensureCommerceAppConfig(tempDir)).rejects.toThrow();
      });
    });
  });

  describe.concurrent("ensureAppConfig", () => {
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
  });

  describe.concurrent("ensureInstallYaml", () => {
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
  });
});
