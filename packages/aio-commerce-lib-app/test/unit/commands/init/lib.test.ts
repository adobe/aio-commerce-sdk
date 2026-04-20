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

const mockExecSync = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("node:child_process", () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

describe("commands/init/lib (unit)", () => {
  beforeEach(() => {
    mockExecSync.mockImplementation(() => Buffer.from(""));
  });

  afterEach(() => {
    mockExecSync.mockReset();
  });

  describe("runInstall", () => {
    test("runs the npm install command with the given dependencies", () => {
      runInstall("npm", ["@adobe/aio-commerce-lib-config"], "/tmp/project");

      expect(mockExecSync).toHaveBeenCalledWith(
        "npm install @adobe/aio-commerce-lib-config",
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("uses the pnpm add command for pnpm", () => {
      runInstall("pnpm", ["@adobe/aio-commerce-lib-config"], "/tmp/project");

      expect(mockExecSync).toHaveBeenCalledWith(
        "pnpm add @adobe/aio-commerce-lib-config",
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("throws when the install fails", () => {
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("install failed");
      });

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

      expect(mockExecSync).toHaveBeenCalledWith(
        "npm install @adobe/aio-commerce-lib-config",
        { cwd: "/tmp/project", stdio: "inherit" },
      );
    });

    test("does not install aio-commerce-lib-config when businessConfig.schema is not selected", () => {
      installDependencies(
        "npm",
        new Set(["eventing.commerce"]),
        "/tmp/project",
      );

      expect(mockExecSync).not.toHaveBeenCalledWith(
        expect.stringContaining("@adobe/aio-commerce-lib-config"),
      );
    });
  });
});
