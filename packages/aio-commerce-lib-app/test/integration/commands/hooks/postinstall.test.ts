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

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  APP_MANIFEST_FILE,
  CONFIG_SCHEMA_FILE_NAME,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  GENERATED_ACTIONS_PATH,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { exec, run } from "#commands/hooks/postinstall";
import { makeTemplateFiles } from "#test/fixtures/commands";
import { configWithBusinessConfig } from "#test/fixtures/config";
import {
  BUSINESS_CONFIG_PROJECT,
  EMPTY_PROJECT,
  INVALID_PROJECT,
  withTempProject,
} from "#test/fixtures/project";

describe("commands/hooks/postinstall", () => {
  describe("run", () => {
    test("generates actions, manifest, and schema", async () => {
      await withTempProject(
        { ...BUSINESS_CONFIG_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithBusinessConfig, tempDir);

          const extensibilityDir = join(
            tempDir,
            getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
          );

          const configurationDir = join(
            tempDir,
            getExtensionPointFolderPath(CONFIGURATION_EXTENSION_POINT_ID),
          );

          const actionsDir = join(extensibilityDir, GENERATED_ACTIONS_PATH);
          expect(existsSync(join(actionsDir, "app-config.js"))).toBe(true);

          const manifestPath = join(
            extensibilityDir,
            ".generated",
            APP_MANIFEST_FILE,
          );

          expect(existsSync(manifestPath)).toBe(true);

          const configSchemaPath = join(
            configurationDir,
            ".generated",
            CONFIG_SCHEMA_FILE_NAME,
          );

          expect(existsSync(configSchemaPath)).toBe(true);
        },
      );
    });
  });

  describe("exec", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    afterEach(() => {
      vi.clearAllMocks();
      exitSpy.mockClear();
    });

    test("succeeds when a valid config file exists", async () => {
      await withTempProject(BUSINESS_CONFIG_PROJECT, async () => {
        await exec();
        expect(exitSpy).not.toHaveBeenCalled();
      });
    });

    test("exits with 1 when config file is missing", async () => {
      await withTempProject(EMPTY_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    test("exits with 1 when config file fails validation", async () => {
      await withTempProject(INVALID_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
