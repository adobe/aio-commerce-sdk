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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { exec } from "#commands/hooks/pre-app-dev";
import { withTempProject } from "#test/fixtures/project";

describe("commands/hooks/pre-app-dev", () => {
  // setNodeEnv writes to INIT_CWD/.env; neutralize the ambient value so it
  // targets each test's temp project (its cwd) rather than the real repo.
  beforeEach(() => {
    vi.stubEnv("INIT_CWD", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("resets NODE_ENV to development in an existing .env", async () => {
    await withTempProject(
      { ".env": "NODE_ENV=production\n" },
      async (tempDir) => {
        await exec();

        const envContents = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContents).toContain("NODE_ENV=development");
        expect(envContents).not.toContain("NODE_ENV=production");
      },
    );
  });

  test("creates the .env with NODE_ENV=development when none exists", async () => {
    await withTempProject({}, async (tempDir) => {
      await exec();

      const envPath = join(tempDir, ".env");
      expect(existsSync(envPath)).toBe(true);
      expect(readFileSync(envPath, "utf8")).toContain("NODE_ENV=development");
    });
  });
});
