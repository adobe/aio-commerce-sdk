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

import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Create a temporary directory with files and execute a callback with the directory path
 * @param files - Object mapping file paths to file contents
 * @param callback - Callback to execute with the temporary directory path
 */
export async function withTempFiles<T>(
  files: Record<string, string>,
  callback: (tempDir: string) => Promise<T>,
): Promise<T> {
  const radix = 36;
  const tempDir = join(
    tmpdir(),
    `aio-test-${Date.now()}-${Math.random().toString(radix).slice(2)}`,
  );

  try {
    await mkdir(tempDir, { recursive: true });

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = join(tempDir, filePath);
      const dir = join(fullPath, "..");

      await mkdir(dir, { recursive: true });
      await writeFile(fullPath, content, "utf-8");
    }

    return await callback(tempDir);
  } finally {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
