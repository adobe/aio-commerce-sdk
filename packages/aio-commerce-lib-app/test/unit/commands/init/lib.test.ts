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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { installDependencies, runInstall } from "#commands/init/lib";

const mockSpawnSync = vi.fn<(...args: unknown[]) => unknown>();
const INSTALL_VERB_RE = /^(i|install)$/;
const CONFIG_PACKAGE_RE = /^@adobe\/aio-commerce-lib-config@/;

vi.mock("node:child_process", () => ({
  spawnSync: (...args: unknown[]) => mockSpawnSync(...args),
}));

describe("commands/init/lib", () => {
  beforeEach(() => {
    mockSpawnSync.mockImplementation(() => ({ status: 0 }));
  });

  afterEach(() => {
    mockSpawnSync.mockReset();
  });

  describe("runInstall", () => {
    test("does nothing when no dependencies are provided", () => {
      runInstall("npm", [], "/tmp/project");
      expect(mockSpawnSync).not.toHaveBeenCalled();
    });

    test("runs the npm install command with the given dependencies", () => {
      runInstall("npm", ["@adobe/aio-commerce-lib-config"], "/tmp/project");

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "npm",
        ["i", "@adobe/aio-commerce-lib-config"],
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("uses the pnpm add command for pnpm", () => {
      runInstall("pnpm", ["@adobe/aio-commerce-lib-config"], "/tmp/project");

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "pnpm",
        ["add", "@adobe/aio-commerce-lib-config"],
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("uses the yarn add command for yarn", () => {
      runInstall("yarn", ["@adobe/aio-commerce-lib-config"], "/tmp/project");

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "yarn",
        ["add", "@adobe/aio-commerce-lib-config"],
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("uses the bun add command for bun", () => {
      runInstall("bun", ["@adobe/aio-commerce-lib-config"], "/tmp/project");
      expect(mockSpawnSync).toHaveBeenCalledWith(
        "bun",
        ["add", "@adobe/aio-commerce-lib-config"],
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("throws when the install fails", () => {
      mockSpawnSync.mockImplementationOnce(() => ({
        error: new Error("install failed"),
        status: 1,
      }));

      expect(() =>
        runInstall("npm", ["@adobe/aio-commerce-lib-config"], "/tmp/project"),
      ).toThrow();
    });
  });

  describe("installDependencies", () => {
    test("installs aio-commerce-lib-config when businessConfig.schema domain is selected", () => {
      installDependencies(
        "npm",
        new Set(["businessConfig.schema"]),
        "/tmp/project",
      );

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "npm",
        [
          expect.stringMatching(INSTALL_VERB_RE),
          expect.stringMatching(CONFIG_PACKAGE_RE),
        ],
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("does not install aio-commerce-lib-config when businessConfig.schema is not selected", () => {
      installDependencies(
        "npm",
        new Set(["eventing.commerce"]),
        "/tmp/project",
      );

      expect(mockSpawnSync).not.toHaveBeenCalled();
    });

    test("installs aio-commerce-lib-config when businessConfig.schema is selected alongside other domains", () => {
      installDependencies(
        "npm",
        new Set(["businessConfig.schema", "eventing.commerce"]),
        "/tmp/project",
      );

      expect(mockSpawnSync).toHaveBeenCalledTimes(1);
      expect(mockSpawnSync).toHaveBeenCalledWith(
        "npm",
        [
          expect.stringMatching(INSTALL_VERB_RE),
          expect.stringMatching(CONFIG_PACKAGE_RE),
        ],
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });
  });
});
