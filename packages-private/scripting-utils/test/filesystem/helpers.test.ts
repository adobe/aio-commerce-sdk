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

import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { touch } from "#filesystem/helpers";
import { withTempFiles } from "#filesystem/temp";

describe("touch", () => {
  test("creates a file when it does not exist", async () => {
    await withTempFiles({}, async (tempDir) => {
      const filePath = join(tempDir, "new-file.txt");
      await touch(filePath);

      const content = await readFile(filePath, "utf-8");
      expect(content).toBe("");
    });
  });

  test("does not overwrite an existing file", async () => {
    await withTempFiles(
      { "existing.txt": "original content" },
      async (tempDir) => {
        const filePath = join(tempDir, "existing.txt");
        await touch(filePath);

        const content = await readFile(filePath, "utf-8");
        expect(content).toBe("original content");
      },
    );
  });

  test("does not modify mtime of an existing file", async () => {
    await withTempFiles(
      { "existing.txt": "original content" },
      async (tempDir) => {
        const filePath = join(tempDir, "existing.txt");
        const before = (await stat(filePath)).mtimeMs;

        // Ensure enough time passes for mtime to differ if modified
        await new Promise((r) => setTimeout(r, 50));
        await touch(filePath);

        const after = (await stat(filePath)).mtimeMs;
        expect(after).toBe(before);
      },
    );
  });

  test("throws for invalid paths (e.g. missing parent directory)", async () => {
    await withTempFiles({}, async (tempDir) => {
      const filePath = join(tempDir, "no-such-dir", "file.txt");
      await expect(touch(filePath)).rejects.toThrow();
    });
  });
});
