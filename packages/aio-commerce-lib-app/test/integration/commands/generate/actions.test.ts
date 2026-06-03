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

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  GENERATED_ACTIONS_PATH,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { exec, run } from "#commands/generate/actions/main";
import { getRuntimeAppConfigPath } from "#commands/utils";
import {
  dynamicOptionsConfigFile,
  dynamicOptionsConfigFileTs,
} from "#test/fixtures/business-config";
import { makeTemplateFiles } from "#test/fixtures/commands";
import {
  configWithBusinessConfig,
  configWithDynamicListOptions,
  configWithFullAdminUiSdk,
  configWithOneScript,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  EMPTY_PROJECT,
  INVALID_PROJECT,
  MINIMAL_PROJECT,
  withTempProject,
} from "#test/fixtures/project";

function getActionsDir(tempDir: string, extensionPointId: string) {
  return join(
    tempDir,
    getExtensionPointFolderPath(extensionPointId),
    GENERATED_ACTIONS_PATH,
  );
}

describe("commands/generate/actions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("run", () => {
    test("generates app-config action for minimal config", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(minimalValidConfig, tempDir);

          const actionsDir = getActionsDir(
            tempDir,
            EXTENSIBILITY_EXTENSION_POINT_ID,
          );

          expect(existsSync(join(actionsDir, "app-config.js"))).toBe(true);
        },
      );
    });

    test("generates ext.config.yaml for extensibility extension point", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(minimalValidConfig, tempDir);

          const extConfigPath = join(
            tempDir,
            getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
            "ext.config.yaml",
          );

          expect(existsSync(extConfigPath)).toBe(true);
        },
      );
    });

    test("generates business configuration actions when business config schema is present", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithBusinessConfig, tempDir);

          const businessActionsDir = getActionsDir(
            tempDir,
            "commerce/configuration/1",
          );

          expect(existsSync(join(businessActionsDir, "config.js"))).toBe(true);
          expect(existsSync(join(businessActionsDir, "scope-tree.js"))).toBe(
            true,
          );
        },
      );
    });

    test("generates installation action with custom scripts loader", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithOneScript, tempDir);

          const actionsDir = getActionsDir(
            tempDir,
            EXTENSIBILITY_EXTENSION_POINT_ID,
          );

          const installationPath = join(actionsDir, "installation.js");
          expect(existsSync(installationPath)).toBe(true);

          const content = await readFile(installationPath, "utf-8");
          expect(content).toContain("customScriptsLoader");
        },
      );
    });

    test("uses static JSON imports when business config schema is static", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithBusinessConfig, tempDir);

          const configPath = join(
            getActionsDir(tempDir, CONFIGURATION_EXTENSION_POINT_ID),
            "config.js",
          );
          const appConfigPath = join(
            getActionsDir(tempDir, EXTENSIBILITY_EXTENSION_POINT_ID),
            "app-config.js",
          );

          const configContent = await readFile(configPath, "utf-8");
          expect(configContent).toContain(
            'import configSchema from "../../configuration-schema.json" with { type: "json" }',
          );
          expect(configContent).not.toContain("#app.commerce.config");

          const appConfigContent = await readFile(appConfigPath, "utf-8");
          expect(appConfigContent).toContain(
            'import appConfig from "../../app.commerce.manifest.json" with { type: "json" }',
          );
          expect(appConfigContent).not.toContain("#app.commerce.config");
        },
      );
    });

    test("rewrites schema/manifest imports when business config schema is dynamic", async () => {
      await withTempProject(
        {
          ...EMPTY_PROJECT,
          ...makeTemplateFiles(),
          "package.json": JSON.stringify({ type: "module" }),
          "app.commerce.config.js": dynamicOptionsConfigFile,
        },
        async (tempDir) => {
          await run(configWithDynamicListOptions, tempDir);

          const configPath = join(
            getActionsDir(tempDir, CONFIGURATION_EXTENSION_POINT_ID),
            "config.js",
          );
          const appConfigPath = join(
            getActionsDir(tempDir, EXTENSIBILITY_EXTENSION_POINT_ID),
            "app-config.js",
          );

          const configContent = await readFile(configPath, "utf-8");
          expect(configContent).toContain('"#app.commerce.config"');
          expect(configContent).toContain(
            "configSchema: appConfig.businessConfig.schema",
          );
          expect(configContent).not.toContain("configuration-schema.json");
          expect(configContent).not.toContain("configuration-schema.js");

          const appConfigContent = await readFile(appConfigPath, "utf-8");
          expect(appConfigContent).toContain('"#app.commerce.config"');
          expect(appConfigContent).not.toContain("app.commerce.manifest.json");
          expect(appConfigContent).not.toContain(
            '"../../app.commerce.manifest.js"',
          );
        },
      );
    });

    test("generates a runtime app config module and #app.commerce.config alias for a JS config file", async () => {
      await withTempProject(
        {
          "package.json": JSON.stringify({ type: "module" }),
          "app.commerce.config.js": dynamicOptionsConfigFile,
          ...makeTemplateFiles(),
        },
        async (tempDir) => {
          await run(configWithDynamicListOptions, tempDir);

          const runtimeConfigPath = join(tempDir, getRuntimeAppConfigPath());
          expect(existsSync(runtimeConfigPath)).toBe(true);

          // JS config files get a passthrough wrapper.
          const moduleContents = await readFile(runtimeConfigPath, "utf-8");
          expect(moduleContents).toContain("import appConfig from");
          expect(moduleContents).toContain("export default appConfig");

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports["#app.commerce.config"]).toBe(
            "./src/commerce-extensibility-1/.generated/app.commerce.config.js",
          );
        },
      );
    });

    test("bundles a TypeScript app config file via esbuild", async () => {
      await withTempProject(
        {
          "package.json": JSON.stringify({ type: "module" }),
          "app.commerce.config.ts": dynamicOptionsConfigFileTs,
          ...makeTemplateFiles(),
        },
        async (tempDir) => {
          await run(configWithDynamicListOptions, tempDir);

          const runtimeConfigPath = join(tempDir, getRuntimeAppConfigPath());
          expect(existsSync(runtimeConfigPath)).toBe(true);

          const mod = await import(runtimeConfigPath);
          expect(mod.default.metadata.id).toBe("dynamic-options");
          expect(typeof mod.default.businessConfig.schema[0].options).toBe(
            "function",
          );
        },
      );
    });

    test("removes the runtime app config module and alias when regenerating as static", async () => {
      await withTempProject(
        {
          ...EMPTY_PROJECT,
          ...makeTemplateFiles(),
          "package.json": JSON.stringify({
            type: "module",
            imports: {
              "#app.commerce.config":
                "./src/commerce-extensibility-1/.generated/app.commerce.config.js",
            },
          }),
          [getRuntimeAppConfigPath()]: "export default {};",
        },
        async (tempDir) => {
          await run(minimalValidConfig, tempDir);
          expect(existsSync(join(tempDir, getRuntimeAppConfigPath()))).toBe(
            false,
          );

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports?.["#app.commerce.config"]).toBeUndefined();
        },
      );
    });

    test("includes workerProcess for worker mass actions in backend-ui/2 ext.config.yaml", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithFullAdminUiSdk, tempDir);

          const extConfigPath = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            "ext.config.yaml",
          );

          const content = await readFile(extConfigPath, "utf-8");
          expect(content).toContain("workerProcess");
          expect(content).toContain("customers/export-customers");
        },
      );
    });

    test("generates ext.config.yaml for backend-ui/2 when adminUi is configured", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithFullAdminUiSdk, tempDir);

          const extConfigPath = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            "ext.config.yaml",
          );

          expect(existsSync(extConfigPath)).toBe(true);

          // No registration action should be generated
          const legacyRegistrationPath = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            ".generated/actions/registration/index.js",
          );
          expect(existsSync(legacyRegistrationPath)).toBe(false);

          const content = await readFile(extConfigPath, "utf-8");
          expect(content).toContain("backend-ui/2");
          expect(content).toContain("index.html");
          expect(content).not.toContain("registration");
        },
      );
    });
  });

  describe("exec", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    afterEach(() => {
      exitSpy.mockClear();
    });

    test("succeeds when a valid config file exists", async () => {
      await withTempProject(MINIMAL_PROJECT, async () => {
        await exec();
        expect(exitSpy).not.toHaveBeenCalled();
      });
    });

    test("exits with 1 when config file is missing", async () => {
      await withTempProject(EMPTY_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    test("exits with 1 when config file is invalid", async () => {
      await withTempProject(INVALID_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
