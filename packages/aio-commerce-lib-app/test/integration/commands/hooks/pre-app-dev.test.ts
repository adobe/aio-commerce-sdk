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

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { run } from "#commands/hooks/pre-app-dev";
import { withTempProject } from "#test/fixtures/project";

describe("commands/hooks/pre-app-dev", () => {
  test("resets NODE_ENV to development in an existing .env", async () => {
    await withTempProject(
      { ".env": "NODE_ENV=production\n", "package.json": "{}" },
      async (tempDir) => {
        await run(tempDir);

        const envContents = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContents).toContain("NODE_ENV=development");
        expect(envContents).not.toContain("NODE_ENV=production");
      },
    );
  });

  test("creates the .env with NODE_ENV=development when none exists", async () => {
    await withTempProject({ "package.json": "{}" }, async (tempDir) => {
      await run(tempDir);

      const envPath = join(tempDir, ".env");
      expect(existsSync(envPath)).toBe(true);
      expect(readFileSync(envPath, "utf8")).toContain("NODE_ENV=development");
    });
  });
});
