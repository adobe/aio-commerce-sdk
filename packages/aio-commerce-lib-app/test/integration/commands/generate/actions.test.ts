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
import { basename, join } from "node:path";

import { consola } from "consola";
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
  configWithAdminUiMenu,
  configWithBusinessConfig,
  configWithDynamicListOptions,
  configWithFullAdminUiV2,
  configWithOneScript,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  EMPTY_PROJECT,
  INVALID_PROJECT,
  MINIMAL_PROJECT,
  makeProjectFiles,
  withTempProject,
} from "#test/fixtures/project";

const { mockSpawnSync } = vi.hoisted(() => ({
  mockSpawnSync: vi.fn((..._args: unknown[]) => ({ status: 0 })),
}));

vi.mock("node:child_process", () => ({ spawnSync: mockSpawnSync }));

function getActionsDir(tempDir: string, extensionPointId: string) {
  return join(
    tempDir,
    getExtensionPointFolderPath(extensionPointId),
    GENERATED_ACTIONS_PATH,
  );
}

describe("commands/generate/actions", () => {
  afterEach(() => {
    mockSpawnSync.mockClear();
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

    test("uses the app config alias when business config schema is static", async () => {
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
          expect(configContent).toContain('"#app.commerce.config"');
          expect(configContent).toContain(
            "configSchema: config.businessConfig.schema",
          );
          expect(configContent).not.toContain("configuration-schema.json");

          const appConfigContent = await readFile(appConfigPath, "utf-8");
          expect(appConfigContent).toContain('"#app.commerce.config"');
          expect(appConfigContent).not.toContain("app.commerce.manifest.json");
        },
      );
    });

    test("uses the app config alias when business config schema is dynamic", async () => {
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
            "configSchema: config.businessConfig.schema",
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

    test("points the app config alias at the generated manifest for static config", async () => {
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
          const runtimeConfigPath = join(tempDir, getRuntimeAppConfigPath());
          expect(existsSync(runtimeConfigPath)).toBe(false);

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports["#app.commerce.config"]).toBe(
            "./src/commerce-extensibility-1/.generated/app.commerce.manifest.json",
          );
        },
      );
    });

    test("keeps the runtime app config alias when generated actions use static JSON imports", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithBusinessConfig, tempDir);
          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports["#app.commerce.config"]).toBe(
            "./src/commerce-extensibility-1/.generated/app.commerce.manifest.json",
          );
        },
      );
    });

    test("includes workerProcess for worker mass actions in backend-ui/2 ext.config.yaml", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithFullAdminUiV2, tempDir);

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

    test("generates ext.config.yaml for backend-ui/2 with view and web but no workerProcess when only adminUi.menu is configured", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithAdminUiMenu, tempDir);

          const extConfigPath = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            "ext.config.yaml",
          );

          expect(existsSync(extConfigPath)).toBe(true);

          const content = await readFile(extConfigPath, "utf-8");
          expect(content).toContain("backend-ui/2");
          expect(content).toContain("index.html");
          expect(content).toContain("web-src");
          expect(content).not.toContain("workerProcess");
        },
      );
    });

    test("scaffolds web-src for backend-ui/2 when a view operation is generated", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithAdminUiMenu, tempDir);

          const webSrcDir = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            "web-src",
          );

          expect(existsSync(join(webSrcDir, "index.html"))).toBe(true);
          expect(existsSync(join(webSrcDir, "index.css"))).toBe(true);
          expect(existsSync(join(webSrcDir, "src", "app.jsx"))).toBe(true);
          expect(
            existsSync(join(webSrcDir, "src", "pages", "main-page.jsx")),
          ).toBe(true);
          expect(
            existsSync(join(webSrcDir, "src", "components", "welcome.jsx")),
          ).toBe(true);

          const appContent = await readFile(
            join(webSrcDir, "src", "app.jsx"),
            "utf-8",
          );
          expect(appContent).toContain("#app.commerce.config");
          expect(appContent).toContain("#web/pages/main-page.jsx");
          expect(appContent).toContain("createExtensionApp");

          const pageContent = await readFile(
            join(webSrcDir, "src", "pages", "main-page.jsx"),
            "utf-8",
          );
          expect(pageContent).toContain("#web/components/welcome.jsx");

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg["@parcel/resolver-default"]).toEqual({
            packageExports: true,
          });
          expect(pkg["@parcel/bundler-default"]).toEqual({
            manualSharedBundles: [
              {
                assets: [
                  "**/@react-spectrum/s2/**",
                  "src/commerce-backend-ui-2/web-src/*.{js,jsx,ts,tsx}",
                ],
                name: "s2-styles",
                types: ["css"],
              },
            ],
          });
          expect(pkg.imports["#web/*"]).toBe(
            "./src/commerce-backend-ui-2/web-src/src/*",
          );
          expect(pkg.imports["#app.commerce.config"]).toBe(
            "./src/commerce-extensibility-1/.generated/app.commerce.manifest.json",
          );
          expect(pkg.dependencies).toEqual(
            expect.objectContaining({
              // biome-ignore lint/performance/useTopLevelRegex: Just a test
              "@adobe/aio-commerce-lib-admin-ui": expect.stringMatching(/^\^/),
              "@react-spectrum/s2": "1.4.0",
              react: "19.2.7",
              "react-dom": "19.2.7",
            }),
          );
          expect(pkg.devDependencies).toEqual({
            "@types/react": "^19.2.7",
            "@types/react-dom": "^19.2.3",
          });

          expect(mockSpawnSync).toHaveBeenCalledTimes(1);
          expect(mockSpawnSync).toHaveBeenCalledWith(
            "pnpm",
            ["i"],
            expect.objectContaining({
              cwd: expect.stringContaining(basename(tempDir)),
            }),
          );
        },
      );
    });

    test("declares compatible installed web-src dependencies without reinstalling them", async () => {
      await withTempProject(
        {
          ...EMPTY_PROJECT,
          ...makeTemplateFiles(),
          "node_modules/@adobe/aio-commerce-lib-admin-ui/package.json":
            JSON.stringify({
              name: "@adobe/aio-commerce-lib-admin-ui",
              version: "0.1.0",
            }),
          "node_modules/@react-spectrum/s2/package.json": JSON.stringify({
            name: "@react-spectrum/s2",
            version: "1.4.0",
          }),
          "node_modules/@types/react/package.json": JSON.stringify({
            name: "@types/react",
            version: "19.2.7",
          }),
          "node_modules/@types/react-dom/package.json": JSON.stringify({
            name: "@types/react-dom",
            version: "19.2.3",
          }),
          "node_modules/react-dom/package.json": JSON.stringify({
            name: "react-dom",
            version: "19.2.7",
          }),
          "node_modules/react/package.json": JSON.stringify({
            name: "react",
            version: "19.2.7",
          }),
        },
        async (tempDir) => {
          await run(configWithAdminUiMenu, tempDir);

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.dependencies).toEqual(
            expect.objectContaining({
              // biome-ignore lint/performance/useTopLevelRegex: Just a test
              "@adobe/aio-commerce-lib-admin-ui": expect.stringMatching(/^\^/),
              "@react-spectrum/s2": "1.4.0",
              react: "19.2.7",
              "react-dom": "19.2.7",
            }),
          );
          expect(pkg.devDependencies).toEqual({
            "@types/react": "^19.2.7",
            "@types/react-dom": "^19.2.3",
          });
          expect(mockSpawnSync).not.toHaveBeenCalled();
        },
      );
    });

    test("scaffolds TSX web-src files when the app config is TypeScript", async () => {
      await withTempProject(
        {
          ...makeProjectFiles(configWithAdminUiMenu),
          ...makeTemplateFiles(),
        },
        async (tempDir) => {
          await run(configWithAdminUiMenu, tempDir);

          const webSrcDir = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            "web-src",
          );

          expect(existsSync(join(webSrcDir, "src", "app.tsx"))).toBe(true);
          expect(
            existsSync(join(webSrcDir, "src", "pages", "main-page.tsx")),
          ).toBe(true);
          expect(
            existsSync(join(webSrcDir, "src", "components", "welcome.tsx")),
          ).toBe(true);
          expect(existsSync(join(webSrcDir, "src", "app.jsx"))).toBe(false);

          const indexHtml = await readFile(
            join(webSrcDir, "index.html"),
            "utf-8",
          );
          expect(indexHtml).toContain("./src/app.tsx");

          const appContent = await readFile(
            join(webSrcDir, "src", "app.tsx"),
            "utf-8",
          );
          expect(appContent).toContain("#web/pages/main-page.tsx");

          const pageContent = await readFile(
            join(webSrcDir, "src", "pages", "main-page.tsx"),
            "utf-8",
          );
          expect(pageContent).toContain("#web/components/welcome.tsx");
        },
      );
    });

    test("does not overwrite an existing web-src entrypoint", async () => {
      const entrypoint = join(
        getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
        "web-src",
        "index.html",
      );

      await withTempProject(
        {
          ...EMPTY_PROJECT,
          ...makeTemplateFiles(),
          [entrypoint]: "<html>custom</html>",
        },
        async (tempDir) => {
          await run(configWithAdminUiMenu, tempDir);

          const entrypointPath = join(tempDir, entrypoint);
          expect(await readFile(entrypointPath, "utf-8")).toBe(
            "<html>custom</html>",
          );
          expect(
            existsSync(
              join(
                tempDir,
                getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
                "web-src",
                "src",
                "app.jsx",
              ),
            ),
          ).toBe(false);
          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports["#web/*"]).toBe(
            "./src/commerce-backend-ui-2/web-src/src/*",
          );
          expect(consola.info).toHaveBeenCalledWith(
            expect.stringContaining(
              "web-src entrypoint already exists, skipping scaffold:",
            ),
          );
          expect(mockSpawnSync).not.toHaveBeenCalled();
        },
      );
    });

    test("generates ext.config.yaml for backend-ui/2 when adminUi is configured", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithFullAdminUiV2, tempDir);

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
