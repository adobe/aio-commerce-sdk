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
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { stringify } from "safe-stable-stringify";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  APP_MANIFEST_FILE,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { exec, run } from "#commands/hooks/pre-app-build";
import { minimalValidConfig } from "#test/fixtures/config";

// syncImsCredentials is the external boundary — reads AIO CLI credentials
vi.mock("@aio-commerce-sdk/scripting-utils/env", () => ({
  syncImsCredentials: vi.fn(),
}));

function makeConfigFile(config: object) {
  return `module.exports = ${stringify(config)}`;
}

describe("commands/hooks/pre-app-build", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("run", () => {
    test("generates manifest for extensibility/1", async () => {
      await withTempFiles(
        {
          "package.json": "{}",
          "app.commerce.config.js": makeConfigFile(minimalValidConfig),
        },
        async (tempDir) => {
          await withChdir(tempDir, () => run("extensibility/1"));

          const manifestPath = join(
            tempDir,
            getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
            ".generated",
            APP_MANIFEST_FILE,
          );

          expect(existsSync(manifestPath)).toBe(true);

          const parsed = JSON.parse(await readFile(manifestPath, "utf-8"));
          expect(parsed.metadata).toEqual(minimalValidConfig.metadata);
        },
      );
    });

    test("throws for unsupported extension", async () => {
      await withTempFiles(
        {
          "package.json": "{}",
          "app.commerce.config.js": makeConfigFile(minimalValidConfig),
        },
        async (tempDir) => {
          await withChdir(tempDir, () =>
            expect(
              // @ts-expect-error Testing with invalid extension value
              run("unknown/1"),
            ).rejects.toThrow("Unsupported extension"),
          );
        },
      );
    });
  });

  describe("exec", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    afterEach(() => {
      exitSpy.mockClear();
    });

    test("exits with 1 when EXTENSION env var is not set", async () => {
      await withTempFiles({ "package.json": "{}" }, async (tempDir) => {
        await withChdir(tempDir, () => exec());
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    test("runs successfully when EXTENSION is set", async () => {
      vi.stubEnv("EXTENSION", "extensibility/1");

      await withTempFiles(
        {
          "package.json": "{}",
          "app.commerce.config.js": makeConfigFile(minimalValidConfig),
        },
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });
  });
});
