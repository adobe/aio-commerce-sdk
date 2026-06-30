/*
 * Copyright 2025 Adobe. All rights reserved.
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
import { rm } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { withTempFiles } from "#filesystem/temp";
import {
  detectPackageManager,
  findNearestPackageJson,
  findUp,
  getExecCommand,
  getInstallCommand,
  getInstalledPackageVersion,
  getPackageDependencyInstallPlan,
  getProjectRootDirectory,
  isESM,
  loadPackageJson,
  makeOutputDirFor,
  mergePackageJsonDependencies,
  readPackageJson,
} from "#project";

describe("findUp", () => {
  test("should find a file in the current directory", async () => {
    await withTempFiles(
      {
        "config.json": "{}",
      },
      async (tempDir) => {
        const result = await findUp("config.json", { cwd: tempDir });
        expect(result).toBe(join(tempDir, "config.json"));
      },
    );
  });

  test("should find a file in a parent directory", async () => {
    await withTempFiles(
      {
        "config.json": "{}",
        "src/components/dummy.txt": "",
      },
      async (tempDir) => {
        const result = await findUp("config.json", {
          cwd: join(tempDir, "src/components"),
        });
        expect(result).toBe(join(tempDir, "config.json"));
      },
    );
  });

  test("should return undefined when file is not found", async () => {
    await withTempFiles({}, async (tempDir) => {
      const result = await findUp("nonexistent.json", { cwd: tempDir });
      expect(result).toBeUndefined();
    });
  });

  test("should find first match from multiple file names", async () => {
    await withTempFiles(
      {
        "config.yaml": "{}",
        "config.json": "{}",
      },
      async (tempDir) => {
        const result = await findUp(["config.json", "config.yaml"], {
          cwd: tempDir,
        });
        expect(result).toBe(join(tempDir, "config.json"));
      },
    );
  });

  test("should stop at stopAt directory", async () => {
    await withTempFiles(
      {
        "config.json": "{}",
        "project/package.json": "{}",
      },
      async (tempDir) => {
        const result = await findUp("config.json", {
          cwd: join(tempDir, "project"),
          stopAt: join(tempDir, "project"),
        });
        expect(result).toBeUndefined();
      },
    );
  });

  test("should stop at root directory", async () => {
    const result = await findUp("nonexistent-file-that-should-never-exist.xyz");
    expect(result).toBeUndefined();
  });
});

describe("findNearestPackageJson", () => {
  test("should find package.json in current directory", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-package" }),
      },
      async (tempDir) => {
        const result = await findNearestPackageJson(tempDir);
        expect(result).toBe(join(tempDir, "package.json"));
      },
    );
  });

  test("should find package.json in parent directory", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-package" }),
        "src/index.js": "",
      },
      async (tempDir) => {
        const result = await findNearestPackageJson(join(tempDir, "src"));
        expect(result).toBe(join(tempDir, "package.json"));
      },
    );
  });

  test("should return null when package.json is not found", async () => {
    await withTempFiles({}, async (tempDir) => {
      const result = await findNearestPackageJson(tempDir);
      expect(result).toBeNull();
    });
  });
});

describe("readPackageJson", () => {
  test("should read and parse package.json", async () => {
    const packageData = {
      name: "test-package",
      version: "1.0.0",
      description: "A test package",
    };

    await withTempFiles(
      {
        "package.json": JSON.stringify(packageData),
      },
      async (tempDir) => {
        const result = await readPackageJson(tempDir);
        expect(result).toEqual(packageData);
      },
    );
  });

  test("should return null when package.json is not found", async () => {
    await withTempFiles({}, async (tempDir) => {
      const result = await readPackageJson(tempDir);
      expect(result).toBeNull();
    });
  });
});

describe("loadPackageJson", () => {
  test("should load package.json with npmcli package-json", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({
          name: "test-package",
          version: "1.0.0",
        }),
      },
      async (tempDir) => {
        const pkg = await loadPackageJson(tempDir);
        expect(pkg?.content.name).toBe("test-package");
        expect(pkg?.content.version).toBe("1.0.0");
      },
    );
  });

  test("should return null when package.json is not found", async () => {
    await withTempFiles({}, async (tempDir) => {
      await expect(loadPackageJson(tempDir)).resolves.toBeNull();
    });
  });
});

describe("package.json dependency helpers", () => {
  test("should resolve an installed package version from a project", async () => {
    await withTempFiles(
      {
        "node_modules/react/package.json": JSON.stringify({
          name: "react",
          version: "19.2.7",
        }),
        "package.json": JSON.stringify({ name: "test-package" }),
      },
      async (tempDir) => {
        await expect(
          getInstalledPackageVersion("react", tempDir),
        ).resolves.toBe("19.2.7");
      },
    );
  });

  test("should return null when an installed package cannot be resolved", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-package" }),
      },
      async (tempDir) => {
        await expect(
          getInstalledPackageVersion("react", tempDir),
        ).resolves.toBe(null);
      },
    );
  });

  test("should resolve a scoped installed package version from a project", async () => {
    await withTempFiles(
      {
        "node_modules/@scope/package/package.json": JSON.stringify({
          name: "@scope/package",
          version: "1.2.3",
        }),
        "package.json": JSON.stringify({ name: "test-package" }),
      },
      async (tempDir) => {
        await expect(
          getInstalledPackageVersion("@scope/package", tempDir),
        ).resolves.toBe("1.2.3");
      },
    );
  });

  test("should plan missing dependencies for installation", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-package" }),
      },
      async (tempDir) => {
        await expect(
          getPackageDependencyInstallPlan(
            [
              { name: "react", version: "^19.0.0" },
              { name: "react-dom", version: "^19.0.0" },
            ],
            tempDir,
          ),
        ).resolves.toEqual({
          incompatible: [],
          missing: [
            { name: "react", version: "^19.0.0" },
            { name: "react-dom", version: "^19.0.0" },
          ],
        });
      },
    );
  });

  test("should accept semver-compatible installed versions even when declared ranges differ", async () => {
    await withTempFiles(
      {
        "node_modules/react/package.json": JSON.stringify({
          name: "react",
          version: "19.2.7",
        }),
        "package.json": JSON.stringify({
          dependencies: { react: "19.2.7" },
          name: "test-package",
        }),
      },
      async (tempDir) => {
        await expect(
          getPackageDependencyInstallPlan(
            [{ name: "react", version: "^19.0.0" }],
            tempDir,
          ),
        ).resolves.toEqual({ incompatible: [], missing: [] });
      },
    );
  });

  test("should refuse incompatible installed versions", async () => {
    await withTempFiles(
      {
        "node_modules/react/package.json": JSON.stringify({
          name: "react",
          version: "18.3.1",
        }),
        "package.json": JSON.stringify({ name: "test-package" }),
      },
      async (tempDir) => {
        await expect(
          getPackageDependencyInstallPlan(
            [{ name: "react", version: "^19.0.0" }],
            tempDir,
          ),
        ).resolves.toEqual({
          incompatible: [
            { installedVersion: "18.3.1", name: "react", version: "^19.0.0" },
          ],
          missing: [],
        });
      },
    );
  });

  test("should merge missing dependencies", () => {
    expect(
      mergePackageJsonDependencies(
        { react: "^18.0.0", typescript: "^5.0.0" },
        [
          { name: "react", version: "^19.0.0" },
          { name: "@types/react", version: "^19.0.0" },
        ],
        [{ react: "^18.0.0" }],
      ),
    ).toEqual({
      "@types/react": "^19.0.0",
      react: "^18.0.0",
      typescript: "^5.0.0",
    });
  });

  test("should preserve declared dependency ranges when the dependency already exists", () => {
    expect(
      mergePackageJsonDependencies({ react: "19.2.7" }, [
        { name: "react", version: "^19.0.0" },
      ]),
    ).toEqual({ react: "19.2.7" });
  });

  test("should not merge dependencies that exist in another dependency map", () => {
    expect(
      mergePackageJsonDependencies(
        {},
        [{ name: "@types/react", version: "^19.0.0" }],
        [{}, { "@types/react": "^18.0.0" }],
      ),
    ).toEqual({});
  });
});

describe("getProjectRootDirectory", () => {
  test("should return the directory containing package.json", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-package" }),
        "src/index.js": "",
      },
      async (tempDir) => {
        const result = await getProjectRootDirectory(join(tempDir, "src"));
        expect(result).toBe(tempDir);
      },
    );
  });

  test("should throw when package.json is not found", async () => {
    await withTempFiles({}, async (tempDir) => {
      await expect(getProjectRootDirectory(tempDir)).rejects.toThrow(
        "Could not find a the root directory of the project",
      );
    });
  });
});

describe("isESM", () => {
  test("should return true for ESM project", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test", type: "module" }),
      },
      async (tempDir) => {
        const result = await isESM(tempDir);
        expect(result).toBe(true);
      },
    );
  });

  test("should return false for CommonJS project", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
      },
      async (tempDir) => {
        const result = await isESM(tempDir);
        expect(result).toBe(false);
      },
    );
  });

  test("should return false when type is commonjs", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test", type: "commonjs" }),
      },
      async (tempDir) => {
        const result = await isESM(tempDir);
        expect(result).toBe(false);
      },
    );
  });

  test("should throw when package.json is not found", async () => {
    await withTempFiles({}, async (tempDir) => {
      await expect(isESM(tempDir)).rejects.toThrow(
        "Could not find a `package.json` file",
      );
    });
  });
});

describe("detectPackageManager", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("should detect npm from package-lock.json", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
        "package-lock.json": "{}",
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("npm");
      },
    );
  });

  test("should detect pnpm from pnpm-lock.yaml", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
        "pnpm-lock.yaml": "",
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("pnpm");
      },
    );
  });

  test("should detect yarn from yarn.lock", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
        "yarn.lock": "",
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("yarn");
      },
    );
  });

  test("should detect yarn from packageManager: yarn@4.x (berry) and collapse to yarn", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({
          name: "test",
          packageManager: "yarn@4.5.1",
        }),
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("yarn");
      },
    );
  });

  test("should detect bun from bun.lockb", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
        "bun.lockb": "",
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("bun");
      },
    );
  });

  test("should fall back to invoking PM via npm_config_user_agent when no lock file is found", async () => {
    vi.stubEnv("npm_config_user_agent", "pnpm/9.0.0 npm/? node/v20.0.0");
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("pnpm");
      },
    );
  });

  test("should default to npm when no lock file and no user-agent are available", async () => {
    vi.stubEnv("npm_config_user_agent", "");
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("npm");
      },
    );
  });

  test("should prefer lockfile over user-agent (on-disk evidence wins)", async () => {
    vi.stubEnv("npm_config_user_agent", "pnpm/9.0.0 npm/? node/v20.0.0");
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
        "yarn.lock": "",
      },
      async (tempDir) => {
        const result = await detectPackageManager(tempDir);
        expect(result).toBe("yarn");
      },
    );
  });
});

describe("getExecCommand", () => {
  test("should return npx for npm", () => {
    expect(getExecCommand("npm")).toBe("npx");
  });

  test("should return pnpm exec for pnpm", () => {
    expect(getExecCommand("pnpm")).toBe("pnpm exec");
  });

  test("should return yarn exec for yarn", () => {
    expect(getExecCommand("yarn")).toBe("yarn exec");
  });

  test("should return bun x for bun", () => {
    expect(getExecCommand("bun")).toBe("bun x");
  });
});

describe("getInstallCommand", () => {
  const pkgs = ["foo", "bar"];

  test("should return npm i <pkgs> for npm", () => {
    expect(getInstallCommand("npm", pkgs)).toEqual({
      command: "npm",
      args: ["i", "foo", "bar"],
    });
  });

  test("should return pnpm add <pkgs> for pnpm", () => {
    expect(getInstallCommand("pnpm", pkgs)).toEqual({
      command: "pnpm",
      args: ["add", "foo", "bar"],
    });
  });

  test("should return yarn add <pkgs> for yarn", () => {
    expect(getInstallCommand("yarn", pkgs)).toEqual({
      command: "yarn",
      args: ["add", "foo", "bar"],
    });
  });

  test("should return bun add <pkgs> for bun", () => {
    expect(getInstallCommand("bun", pkgs)).toEqual({
      command: "bun",
      args: ["add", "foo", "bar"],
    });
  });

  test("should return dev dependency install args", () => {
    expect(getInstallCommand("npm", pkgs, { dev: true })).toEqual({
      command: "npm",
      args: ["i", "--save-dev", "foo", "bar"],
    });
    expect(getInstallCommand("pnpm", pkgs, { dev: true })).toEqual({
      command: "pnpm",
      args: ["add", "--save-dev", "foo", "bar"],
    });
    expect(getInstallCommand("yarn", pkgs, { dev: true })).toEqual({
      command: "yarn",
      args: ["add", "--dev", "foo", "bar"],
    });
    expect(getInstallCommand("bun", pkgs, { dev: true })).toEqual({
      command: "bun",
      args: ["add", "--dev", "foo", "bar"],
    });
  });
});

describe("makeOutputDirFor", () => {
  test("should create output directory when it doesn't exist", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
      },
      async () => {
        // Create a new directory that doesn't exist
        const outputPath = await makeOutputDirFor("newdir");

        expect(outputPath).toContain("newdir");
        expect(existsSync(outputPath)).toBe(true);

        // Clean up the created directory
        await rm(outputPath, { recursive: true, force: true });
      },
    );
  });

  test("should not recreate existing directory", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test" }),
        "dist/file.txt": "test",
      },
      async () => {
        // Create dist directory first
        const outputPath = await makeOutputDirFor("dist");

        expect(outputPath).toContain("dist");
        expect(existsSync(outputPath)).toBe(true);
      },
    );
  });
});
