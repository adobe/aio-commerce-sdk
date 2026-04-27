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

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  APP_MANIFEST_FILE,
  CONFIG_SCHEMA_FILE_NAME,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { exec, run } from "#commands/hooks/pre-app-build";
import {
  configWithBusinessConfig,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  EMPTY_PROJECT,
  INVALID_PROJECT,
  MINIMAL_PROJECT,
  makeProjectFiles,
  withTempProject,
} from "#test/fixtures/project";

// syncImsCredentials is the external boundary — reads AIO CLI credentials
vi.mock("@aio-commerce-sdk/scripting-utils/env", () => ({
  syncImsCredentials: vi.fn(),
}));

describe("commands/hooks/pre-app-build", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("run", () => {
    test("generates manifest for extensibility/1", async () => {
      await withTempProject(MINIMAL_PROJECT, async (tempDir) => {
        await run("extensibility/1");

        const manifestPath = join(
          tempDir,
          getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
          ".generated",
          APP_MANIFEST_FILE,
        );

        expect(existsSync(manifestPath)).toBe(true);

        const parsed = JSON.parse(await readFile(manifestPath, "utf-8"));
        expect(parsed).toEqual(minimalValidConfig);
      });
    });

    test("generates schema for configuration/1", async () => {
      await withTempProject(
        makeProjectFiles(configWithBusinessConfig),
        async (tempDir) => {
          await run("configuration/1");

          const schemaPath = join(
            tempDir,
            getExtensionPointFolderPath(CONFIGURATION_EXTENSION_POINT_ID),
            ".generated",
            CONFIG_SCHEMA_FILE_NAME,
          );

          expect(existsSync(schemaPath)).toBe(true);

          const parsed = JSON.parse(await readFile(schemaPath, "utf-8"));
          expect(parsed).toEqual(
            configWithBusinessConfig.businessConfig.schema,
          );
        },
      );
    });

    test("throws for unsupported extension", async () => {
      await withTempProject(MINIMAL_PROJECT, async () => {
        await expect(
          // @ts-expect-error Testing with invalid extension value
          run("unknown/1"),
        ).rejects.toThrow("Unsupported extension");
      });
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
      await withTempProject(EMPTY_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    test("runs successfully for extensibility/1", async () => {
      vi.stubEnv("EXTENSION", "extensibility/1");

      await withTempProject(MINIMAL_PROJECT, async () => {
        await exec();
        expect(exitSpy).not.toHaveBeenCalled();
      });
    });

    test("runs successfully for configuration/1", async () => {
      vi.stubEnv("EXTENSION", "configuration/1");

      await withTempProject(
        makeProjectFiles(configWithBusinessConfig),
        async () => {
          await exec();
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });

    test("exits with 1 when config file is invalid", async () => {
      vi.stubEnv("EXTENSION", "extensibility/1");

      await withTempProject(INVALID_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
