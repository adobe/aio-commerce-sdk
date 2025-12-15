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
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { withTempFiles } from "#filesystem/temp";

describe("withTempFiles", () => {
  test("should create temporary directory with files", async () => {
    const files = {
      "file1.txt": "content1",
      "file2.txt": "content2",
    };

    await withTempFiles(files, async (tempDir) => {
      expect(existsSync(tempDir)).toBe(true);
      expect(existsSync(join(tempDir, "file1.txt"))).toBe(true);
      expect(existsSync(join(tempDir, "file2.txt"))).toBe(true);

      const content1 = await readFile(join(tempDir, "file1.txt"), "utf-8");
      const content2 = await readFile(join(tempDir, "file2.txt"), "utf-8");

      expect(content1).toBe("content1");
      expect(content2).toBe("content2");
    });
  });

  test("should create nested directory structure", async () => {
    const files = {
      "src/index.js": "console.log('hello');",
      "src/utils/helper.js": "export const help = () => {};",
      "package.json": '{"name":"test"}',
    };

    await withTempFiles(files, (tempDir) => {
      expect(existsSync(join(tempDir, "src"))).toBe(true);
      expect(existsSync(join(tempDir, "src/utils"))).toBe(true);
      expect(existsSync(join(tempDir, "src/index.js"))).toBe(true);
      expect(existsSync(join(tempDir, "src/utils/helper.js"))).toBe(true);
      expect(existsSync(join(tempDir, "package.json"))).toBe(true);
    });
  });

  test("should clean up temporary directory after callback", async () => {
    let tempDirPath = "";

    await withTempFiles({ "test.txt": "test" }, (tempDir) => {
      tempDirPath = tempDir;
      expect(existsSync(tempDir)).toBe(true);
    });

    // Directory should be cleaned up after callback
    expect(existsSync(tempDirPath)).toBe(false);
  });

  test("should return callback result", async () => {
    const result = await withTempFiles(
      { "test.txt": "test" },
      async () => "callback result",
    );

    expect(result).toBe("callback result");
  });

  test("should clean up even if callback throws", async () => {
    let tempDirPath = "";

    await expect(
      withTempFiles({ "test.txt": "test" }, (tempDir) => {
        tempDirPath = tempDir;
        throw new Error("Test error");
      }),
    ).rejects.toThrow("Test error");

    // Directory should still be cleaned up
    expect(existsSync(tempDirPath)).toBe(false);
  });

  test("should handle empty files object", async () => {
    await withTempFiles({}, (tempDir) => {
      expect(existsSync(tempDir)).toBe(true);
    });
  });

  test("should create files with correct content encoding", async () => {
    const files = {
      "utf8.txt": "Hello 世界 🌍",
      "json.json": JSON.stringify({ key: "value" }, null, 2),
    };

    await withTempFiles(files, async (tempDir) => {
      const utf8Content = await readFile(join(tempDir, "utf8.txt"), "utf-8");
      const jsonContent = await readFile(join(tempDir, "json.json"), "utf-8");

      expect(utf8Content).toBe("Hello 世界 🌍");
      expect(JSON.parse(jsonContent)).toEqual({ key: "value" });
    });
  });

  test("should create unique temporary directories", async () => {
    const dirs: string[] = [];

    await withTempFiles({}, (tempDir) => {
      dirs.push(tempDir);
    });

    await withTempFiles({}, (tempDir) => {
      dirs.push(tempDir);
    });

    // Each call should create a unique directory
    expect(dirs[0]).not.toBe(dirs[1]);
  });
});
