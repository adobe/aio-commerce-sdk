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
import { createRequire } from "node:module";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  scaffoldTypeScriptProject,
  syncActionsTypecheckScript,
  syncWebSourceTypecheckScript,
} from "#commands/typescript";
import { withTempProject } from "#test/fixtures/project";

const { mockSpawnSync } = vi.hoisted(() => ({
  mockSpawnSync: vi.fn(() => ({ status: 0 })),
}));

vi.mock("node:child_process", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:child_process")>()),
  spawnSync: mockSpawnSync,
}));

describe("commands/typescript", () => {
  afterEach(() => {
    mockSpawnSync.mockClear();
  });

  test("scaffolds TypeScript project files and development dependencies", async () => {
    await withTempProject(
      {
        "package.json": JSON.stringify({ type: "module" }),
      },
      async (tempDir) => {
        await scaffoldTypeScriptProject("npm");

        const webpackPath = join(tempDir, "webpack-config.cjs");
        const require = createRequire(import.meta.url);
        expect(require(webpackPath)).toMatchObject({
          module: {
            rules: [expect.objectContaining({ use: "ts-loader" })],
          },
        });

        const tsconfig = JSON.parse(
          await readFile(join(tempDir, "tsconfig.json"), "utf-8"),
        );
        expect(tsconfig.extends).toEqual(
          expect.arrayContaining([
            "@tsconfig/bases/recommended",
            "@tsconfig/bases/node-ts",
            "@tsconfig/bases/node24",
          ]),
        );
        expect(tsconfig.include).toEqual(
          expect.arrayContaining([
            "app.commerce.config.ts",
            "src/**/.generated/actions/**/*.js",
          ]),
        );
        expect(tsconfig.exclude).toContain("src/**/web-src/**");

        expect(mockSpawnSync).toHaveBeenCalledWith(
          "npm",
          expect.arrayContaining([
            `@tsconfig/bases@${__TSCONFIG_BASES_VERSION__}`,
            `ts-loader@${__TS_LOADER_VERSION__}`,
            `typescript@${__TYPESCRIPT_VERSION__}`,
          ]),
          expect.objectContaining({ stdio: "inherit" }),
        );
      },
    );
  });

  test("preserves existing project configuration files", async () => {
    const webpackConfig = 'module.exports = { mode: "development" };\n';
    const tsconfig = '{ "include": ["custom/**/*.ts"] }\n';

    await withTempProject(
      {
        "package.json": JSON.stringify({ type: "module" }),
        "tsconfig.json": tsconfig,
        "webpack-config.js": webpackConfig,
      },
      async (tempDir) => {
        await scaffoldTypeScriptProject("npm");
        await expect(
          readFile(join(tempDir, "webpack-config.js"), "utf-8"),
        ).resolves.toBe(webpackConfig);

        await expect(
          readFile(join(tempDir, "tsconfig.json"), "utf-8"),
        ).resolves.toBe(tsconfig);

        expect(existsSync(join(tempDir, "webpack-config.cjs"))).toBe(false);
      },
    );
  });

  test("does not treat custom Webpack filenames as project configuration", async () => {
    const webpackConfig = 'module.exports = { mode: "development" };\n';

    await withTempProject(
      {
        "custom-webpack-config.cjs": webpackConfig,
        "package.json": JSON.stringify({ type: "module" }),
      },
      async (tempDir) => {
        await scaffoldTypeScriptProject("npm");
        await expect(
          readFile(join(tempDir, "custom-webpack-config.cjs"), "utf-8"),
        ).resolves.toBe(webpackConfig);

        expect(existsSync(join(tempDir, "webpack-config.cjs"))).toBe(true);
      },
    );
  });

  test("rejects incompatible TypeScript dependencies", async () => {
    await withTempProject(
      {
        "node_modules/typescript/package.json": JSON.stringify({
          version: "4.9.5",
        }),
        "package.json": JSON.stringify({
          devDependencies: { typescript: "4.9.5" },
          type: "module",
        }),
      },
      async () => {
        await expect(scaffoldTypeScriptProject("npm")).rejects.toThrow(
          `typescript@4.9.5 does not satisfy ${__TYPESCRIPT_VERSION__}`,
        );
      },
    );
  });

  test.each([
    ["npm", "package-lock.json", "{}"],
    ["pnpm", "pnpm-lock.yaml", "lockfileVersion: '9.0'"],
    ["yarn", "yarn.lock", ""],
    ["bun", "bun.lockb", ""],
  ] as const)(
    "composes generated typecheck commands with %s",
    async (packageManager, lockFile, lockFileContent) => {
      await withTempProject(
        {
          [lockFile]: lockFileContent,
          "package.json": JSON.stringify({
            scripts: { typecheck: "eslint ." },
            type: "module",
          }),
          "src/commerce-backend-ui-2/web-src/tsconfig.json": "{}",
        },
        async (tempDir) => {
          await syncActionsTypecheckScript();
          await syncActionsTypecheckScript();
          await syncWebSourceTypecheckScript();

          const pkg = JSON.parse(
            await readFile(join(tempDir, "package.json"), "utf-8"),
          );
          expect(pkg.scripts.typecheck).toBe(
            `eslint . && ${packageManager} run typecheck:actions && ${packageManager} run typecheck:web-src`,
          );
          expect(pkg.scripts["typecheck:actions"]).toBe(
            "tsc --noEmit -p tsconfig.json",
          );
          expect(pkg.scripts["typecheck:web-src"]).toBe(
            "tsc --noEmit -p src/commerce-backend-ui-2/web-src/tsconfig.json",
          );
        },
      );
    },
  );
});
