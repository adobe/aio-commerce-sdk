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

import { describe, expect, test } from "vitest";

import { withTempFiles } from "#filesystem/temp";
import {
  detectPackageManager,
  findNearestPackageJson,
  findUp,
  getExecCommand,
  getProjectRootDirectory,
  isESM,
  makeOutputDirFor,
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

  test("should default to npm when no lock file is found", async () => {
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
});

describe("getExecCommand", () => {
  test("should return npx for npm", () => {
    expect(getExecCommand("npm")).toBe("npx");
  });

  test("should return pnpx for pnpm", () => {
    expect(getExecCommand("pnpm")).toBe("pnpx");
  });

  test("should return yarn dlx for yarn", () => {
    expect(getExecCommand("yarn")).toBe("yarn dlx");
  });

  test("should return bunx for bun", () => {
    expect(getExecCommand("bun")).toBe("bunx");
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
