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

import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

const pluginDir = fileURLToPath(new URL("../../", import.meta.url));
const assetsDir = join(pluginDir, "skills/commerce-app-storage/assets");
const fixtureDir = join(pluginDir, "test/fixtures/generated-installation");
const require = createRequire(import.meta.url);

it.each([false, true])(
  "strict generated installation compilation with DB declarations: %s",
  async (withDeclarations) => {
    const projectDir = await mkdtemp(join(tmpdir(), "commerce-storage-types-"));
    try {
      await cp(fixtureDir, projectDir, { recursive: true });
      await mkdir(join(projectDir, "scripts"));
      await cp(
        join(assetsDir, "setup-database.ts"),
        join(projectDir, "scripts/setup-database.ts"),
      );
      await mkdir(join(projectDir, "src/actions"), { recursive: true });
      await cp(
        join(assetsDir, "db-action.ts"),
        join(projectDir, "src/actions/storage.ts"),
      );
      const dbPackageDir = join(projectDir, "node_modules/@adobe/aio-lib-db");
      await mkdir(dbPackageDir, { recursive: true });
      await writeFile(
        join(dbPackageDir, "package.json"),
        JSON.stringify({ main: "index.js", name: "@adobe/aio-lib-db" }),
      );
      await writeFile(
        join(dbPackageDir, "index.js"),
        "exports.init = () => {};",
      );
      if (withDeclarations) {
        await cp(
          join(assetsDir, "aio-lib-db.d.ts"),
          join(projectDir, "src/types/aio-lib-db.d.ts"),
        );
      }
      const result = spawnSync(
        process.execPath,
        [
          require.resolve("typescript/bin/tsc"),
          "--noEmit",
          "--pretty",
          "false",
          "-p",
          join(projectDir, "tsconfig.json"),
        ],
        { encoding: "utf8" },
      );
      if (result.error) {
        throw result.error;
      }
      if (withDeclarations) {
        expect(result.status, result.stdout + result.stderr).toBe(0);
      } else {
        expect(result.status).not.toBe(0);
        expect(result.stdout).toContain("scripts/setup-database.ts");
        expect(result.stdout).toContain("TS7016");
      }
    } finally {
      await rm(projectDir, { force: true, recursive: true });
    }
  },
  30_000,
);
