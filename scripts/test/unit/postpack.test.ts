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

import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test } from "vitest";

import postpack from "#postpack";
import {
  EXISTING_BACKUP_PACKAGE_JSON,
  ORIGINAL_PACKAGE_JSON,
  readTextFile,
} from "#test/fixtures/pack";

describe("postpack.ts", () => {
  test("restores package.json from the backup file", async () => {
    await withTempFiles(
      {
        ".build/package.json.orig": EXISTING_BACKUP_PACKAGE_JSON,
        "package.json": ORIGINAL_PACKAGE_JSON,
      },
      (tempDir) => {
        withChdir(tempDir, () => {
          postpack();

          const packageJson = readTextFile(join(tempDir, "package.json"));
          const backupPackageJsonPath = join(
            tempDir,
            ".build/package.json.orig",
          );

          expect(packageJson).toBe(EXISTING_BACKUP_PACKAGE_JSON);
          expect(existsSync(backupPackageJsonPath)).toBe(false);
        });
      },
    );
  });

  test("does nothing when the backup file is missing", async () => {
    await withTempFiles(
      {
        "package.json": ORIGINAL_PACKAGE_JSON,
      },
      (tempDir) => {
        withChdir(tempDir, () => {
          postpack();

          const packageJson = readTextFile(join(tempDir, "package.json"));
          const backupPackageJsonPath = join(
            tempDir,
            ".build/package.json.orig",
          );

          expect(packageJson).toBe(ORIGINAL_PACKAGE_JSON);
          expect(existsSync(backupPackageJsonPath)).toBe(false);
        });
      },
    );
  });
});
