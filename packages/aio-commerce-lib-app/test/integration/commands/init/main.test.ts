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
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  APP_CONFIG_FILE,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  INSTALL_YAML_FILE,
  PACKAGE_JSON_FILE,
} from "#commands/constants";
import { exec, run } from "#commands/init/main";
import { getGeneratedDir } from "#commands/utils";
import { INSTALL_COMMAND_RE } from "#test/fixtures/exec";
import {
  EMPTY_PROJECT,
  INVALID_PROJECT,
  withTempProject,
} from "#test/fixtures/project";

import type { PackageJson } from "type-fest";

const { mockSpawnSync } = vi.hoisted(() => ({
  mockSpawnSync: vi.fn(() => ({ status: 0 })),
}));

const PACKAGE_MANAGER_CASES = [
  {
    execCommand: "npx",
    installPrefix: "npm i",
    lockFile: ["package-lock.json", "{}"] as const,
    packageManager: "npm",
  },
  {
    execCommand: "pnpm exec",
    installPrefix: "pnpm add",
    lockFile: ["pnpm-lock.yaml", "lockfileVersion: '9.0'"] as const,
    packageManager: "pnpm",
  },
  {
    execCommand: "yarn exec",
    installPrefix: "yarn add",
    lockFile: ["yarn.lock", ""] as const,
    packageManager: "yarn",
  },
  {
    execCommand: "bun x",
    installPrefix: "bun add",
    lockFile: ["bun.lockb", ""] as const,
    packageManager: "bun",
  },
] as const;

vi.mock("node:child_process", () => ({ spawnSync: mockSpawnSync }));

function stringifySpawnCall(call: unknown[]): string | null {
  const [command, args] = call;
  if (typeof command !== "string") {
    return null;
  }

  if (!(Array.isArray(args) && args.every((arg) => typeof arg === "string"))) {
    return command;
  }

  return [command, ...args].join(" ");
}

function getInstallCalls(): string[] {
  return mockSpawnSync.mock.calls
    .map((call) => stringifySpawnCall(call))
    .filter((call): call is string => call !== null)
    .filter((command) => INSTALL_COMMAND_RE.test(command));
}

describe("commands/init/main", () => {
  afterEach(() => {
    mockSpawnSync.mockClear();
  });

  describe("run", () => {
    test("orchestrates the init flow: installs deps, syncs package.json, wires up yaml extension points, and leaves generated dirs populated", async () => {
      await withTempProject(EMPTY_PROJECT, async (tempDir) => {
        await run(
          {
            appName: "Smoke App",
            configFormat: "ts",
            domains: [
              "businessConfig.schema",
              "eventing.commerce",
              "eventing.external",
              "installation.customInstallationSteps",
            ],
          },
          { formatConfig: false },
        );

        const pkgJson: PackageJson = JSON.parse(
          await readFile(join(tempDir, PACKAGE_JSON_FILE), "utf-8"),
        );

        expect(pkgJson.name).toBe("smoke-app");
        expect(pkgJson.version).toBe("1.0.0");
        expect(pkgJson.description).toBeTruthy();
        expect(pkgJson.scripts?.postinstall).toContain(
          "aio-commerce-lib-app hooks postinstall",
        );

        // At least one package install was invoked
        const installCalls = getInstallCalls();
        expect(installCalls.length).toBeGreaterThan(0);

        expect(existsSync(join(tempDir, "app.commerce.config.ts"))).toBe(true);

        const appConfig = await readFile(
          join(tempDir, APP_CONFIG_FILE),
          "utf-8",
        );
        expect(appConfig).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        expect(appConfig).toContain(CONFIGURATION_EXTENSION_POINT_ID);

        const installYaml = await readFile(
          join(tempDir, INSTALL_YAML_FILE),
          "utf-8",
        );
        expect(installYaml).toContain(EXTENSIBILITY_EXTENSION_POINT_ID);
        expect(installYaml).toContain(CONFIGURATION_EXTENSION_POINT_ID);

        // Both extension points produced populated .generated dirs.
        const extensibilityGenerated = await readdir(
          join(tempDir, getGeneratedDir(EXTENSIBILITY_EXTENSION_POINT_ID)),
        );
        expect(extensibilityGenerated.length).toBeGreaterThan(0);

        const configurationGenerated = await readdir(
          join(tempDir, getGeneratedDir(CONFIGURATION_EXTENSION_POINT_ID)),
        );
        expect(configurationGenerated.length).toBeGreaterThan(0);
      });
    });

    test.each(
      PACKAGE_MANAGER_CASES,
    )("uses $packageManager commands throughout init when $lockFile.0 is present", async ({
      execCommand,
      installPrefix,
      lockFile,
    }) => {
      await withTempProject(
        {
          ...EMPTY_PROJECT,
          [lockFile[0]]: lockFile[1],
        },
        async (tempDir) => {
          await run(
            {
              appName: "Package Manager App",
              configFormat: "ts",
              domains: ["businessConfig.schema"],
            },
            { formatConfig: false },
          );

          const pkgJson: PackageJson = JSON.parse(
            await readFile(join(tempDir, PACKAGE_JSON_FILE), "utf-8"),
          );
          expect(pkgJson.scripts?.postinstall).toBe(
            `${execCommand} aio-commerce-lib-app hooks postinstall`,
          );

          const installCalls = getInstallCalls();
          expect(installCalls).toHaveLength(2);
          expect(
            installCalls.every((call) => call.startsWith(installPrefix)),
          ).toBe(true);
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

    test("exits with 1 when the existing config file is invalid", async () => {
      await withTempProject(INVALID_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    test("exits with 1 when an unexpected error is thrown", async () => {
      mockSpawnSync.mockImplementationOnce(() => ({
        error: new Error("Unexpected error"),
        status: 1,
      }));

      await withTempProject(EMPTY_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
