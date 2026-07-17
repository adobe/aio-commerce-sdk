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
import {
  WEB_SOURCE_DEPENDENCIES,
  WEB_SOURCE_DEV_DEPENDENCIES,
} from "#commands/generate/actions/constants";
import { exec, run } from "#commands/generate/actions/main";
import { getManifestPath, getRuntimeAppConfigPath } from "#commands/utils";
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
  configWithWorkerMassActions,
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

const LEADING_CARET_PATTERN = /^\^/u;

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
          "app.commerce.config.js": dynamicOptionsConfigFile,
          "package.json": JSON.stringify({ type: "module" }),
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
          "app.commerce.config.js": dynamicOptionsConfigFile,
          "package.json": JSON.stringify({ type: "module" }),
          ...makeTemplateFiles(),
        },
        async (tempDir) => {
          await run(configWithDynamicListOptions, tempDir);

          const runtimeConfigPath = join(tempDir, getRuntimeAppConfigPath());
          expect(existsSync(runtimeConfigPath)).toBe(true);

          // JS config files get a passthrough wrapper.
          const moduleContents = await readFile(runtimeConfigPath, "utf-8");
          expect(moduleContents).toContain("import appConfig from");
          expect(moduleContents).toContain("export * from");
          expect(moduleContents).toContain("export default appConfig");

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports["#app.commerce.config"]).toBe(
            "./src/commerce-extensibility-1/.generated/app.commerce.config.js",
          );

          // Named exports from the source config file are re-exported alongside the default.
          const mod = await import(runtimeConfigPath);
          expect(mod.paymentMethodOptions).toEqual([
            { label: "Braintree", value: "braintree" },
          ]);
        },
      );
    });

    test("bundles a TypeScript app config file via esbuild", async () => {
      await withTempProject(
        {
          "app.commerce.config.ts": dynamicOptionsConfigFileTs,
          "package.json": JSON.stringify({ type: "module" }),
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

    test("writes a JSON passthrough module and #app.commerce.config alias for static config", async () => {
      await withTempProject(
        {
          ...EMPTY_PROJECT,
          ...makeTemplateFiles(),
          "package.json": JSON.stringify({ type: "module" }),
          // The generate manifest command writes this; seed it so the passthrough
          // module resolves when imported below.
          [getManifestPath()]: JSON.stringify({ metadata: { id: "static" } }),
        },
        async (tempDir) => {
          await run(configWithBusinessConfig, tempDir);

          const runtimeConfigPath = join(tempDir, getRuntimeAppConfigPath());
          expect(existsSync(runtimeConfigPath)).toBe(true);

          const moduleContents = await readFile(runtimeConfigPath, "utf-8");
          expect(moduleContents).toContain(
            'import appConfig from "./app.commerce.manifest.json" with { type: "json" }',
          );
          expect(moduleContents).toContain("export default appConfig");

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports["#app.commerce.config"]).toBe(
            "./src/commerce-extensibility-1/.generated/app.commerce.config.js",
          );

          // The generated module must actually import without a JSON attribute error.
          const mod = await import(runtimeConfigPath);
          expect(mod.default).toEqual({ metadata: { id: "static" } });
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

          const indexContent = await readFile(
            join(webSrcDir, "index.html"),
            "utf-8",
          );
          expect(indexContent).toContain("<title>Test App</title>");
          expect(indexContent).not.toContain("APP_TITLE");

          // tsconfig.json is only scaffolded for TypeScript web-src.
          expect(existsSync(join(webSrcDir, "tsconfig.json"))).toBe(false);

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
            "./src/commerce-extensibility-1/.generated/app.commerce.config.js",
          );
          expect(Object.keys(pkg.dependencies)).toEqual(
            expect.arrayContaining([
              "@adobe/aio-commerce-lib-admin-ui",
              "@react-spectrum/s2",
              "react",
              "react-dom",
            ]),
          );
          expect(Object.keys(pkg.devDependencies)).toEqual(
            expect.arrayContaining(["@types/react", "@types/react-dom"]),
          );

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

          const tsconfig = JSON.parse(
            await readFile(join(webSrcDir, "tsconfig.json"), "utf-8"),
          );
          expect(tsconfig.extends).toContain("@tsconfig/bases/recommended");
          expect(tsconfig.compilerOptions.jsx).toBe("react-jsx");

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.devDependencies["@tsconfig/bases"]).toBe("latest");
          expect(pkg.devDependencies.typescript).toBe("latest");
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

    test("throws when an installed web-src dependency is incompatible", async () => {
      await withTempProject(
        {
          ...EMPTY_PROJECT,
          ...makeTemplateFiles(),
          // React 17 does not satisfy the required range pinned at build time.
          [join("node_modules", "react", "package.json")]: JSON.stringify({
            name: "react",
            version: "17.0.0",
          }),
        },
        async (tempDir) => {
          await expect(run(configWithAdminUiMenu, tempDir)).rejects.toThrow(
            "Cannot scaffold web-src because installed dependencies are incompatible",
          );

          expect(mockSpawnSync).not.toHaveBeenCalled();
        },
      );
    });

    test("does not run install when all web-src dependencies are already installed", async () => {
      // Seed every required (JSX) web-src dependency as installed with a
      // version that satisfies its required range.
      const installedDependencies = Object.fromEntries(
        [...WEB_SOURCE_DEPENDENCIES, ...WEB_SOURCE_DEV_DEPENDENCIES].map(
          ({ name, version }) => [
            join("node_modules", name, "package.json"),
            JSON.stringify({
              name,
              version: version.replace(LEADING_CARET_PATTERN, ""),
            }),
          ],
        ),
      );

      await withTempProject(
        {
          ...EMPTY_PROJECT,
          ...makeTemplateFiles(),
          ...installedDependencies,
        },
        async (tempDir) => {
          await run(configWithAdminUiMenu, tempDir);

          const webSrcDir = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            "web-src",
          );

          // Distinct from the skip-if-exists case: the scaffold still runs.
          expect(existsSync(join(webSrcDir, "index.html"))).toBe(true);
          expect(existsSync(join(webSrcDir, "src", "app.jsx"))).toBe(true);

          expect(consola.info).toHaveBeenCalledWith(
            "web-src dependencies are already installed.",
          );
          expect(mockSpawnSync).not.toHaveBeenCalled();
        },
      );
    });

    test("does not scaffold web-src or write the #web/* alias when adminUi has no view operation", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithWorkerMassActions, tempDir);

          const extensionDir = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
          );

          expect(existsSync(join(extensionDir, "ext.config.yaml"))).toBe(true);
          expect(existsSync(join(extensionDir, "web-src"))).toBe(false);

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.imports["#web/*"]).toBeUndefined();
          expect(mockSpawnSync).not.toHaveBeenCalled();
        },
      );
    });

    test("scaffolds JSX web-src files when a JavaScript app config file exists", async () => {
      await withTempProject(
        {
          ...makeProjectFiles(configWithAdminUiMenu, "cjs"),
          ...makeTemplateFiles(),
        },
        async (tempDir) => {
          await run(configWithAdminUiMenu, tempDir);

          const webSrcDir = join(
            tempDir,
            getExtensionPointFolderPath(BACKEND_UI_V2_EXTENSION_POINT_ID),
            "web-src",
          );

          expect(existsSync(join(webSrcDir, "src", "app.jsx"))).toBe(true);
          expect(existsSync(join(webSrcDir, "src", "app.tsx"))).toBe(false);
          expect(existsSync(join(webSrcDir, "tsconfig.json"))).toBe(false);

          const indexHtml = await readFile(
            join(webSrcDir, "index.html"),
            "utf-8",
          );
          expect(indexHtml).toContain("./src/app.jsx");
        },
      );
    });

    test("throws when installing web-src dependencies fails", async () => {
      mockSpawnSync.mockReturnValueOnce({ status: 1 });

      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await expect(run(configWithAdminUiMenu, tempDir)).rejects.toThrow(
            "Failed to install dependencies automatically",
          );
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
