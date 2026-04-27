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
  EXTENSIBILITY_EXTENSION_POINT_ID,
  GENERATED_ACTIONS_PATH,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { exec, run } from "#commands/generate/actions/main";
import { makeTemplateFiles } from "#test/fixtures/commands";
import {
  configWithBusinessConfig,
  configWithOneScript,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  EMPTY_PROJECT,
  INVALID_PROJECT,
  MINIMAL_PROJECT,
  withTempProject,
} from "#test/fixtures/project";

function getActionsDir(tempDir: string, extensionPointId: string) {
  return join(
    tempDir,
    getExtensionPointFolderPath(extensionPointId),
    GENERATED_ACTIONS_PATH,
  );
}

describe("commands/generate/actions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("run", () => {
    test("generates app-config action for minimal config", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(minimalValidConfig, tempDir);

          const actionsDir = getActionsDir(
            tempDir,
            EXTENSIBILITY_EXTENSION_POINT_ID,
          );

          expect(existsSync(join(actionsDir, "app-config.js"))).toBe(true);
        },
      );
    });

    test("generates ext.config.yaml for extensibility extension point", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(minimalValidConfig, tempDir);

          const extConfigPath = join(
            tempDir,
            getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
            "ext.config.yaml",
          );

          expect(existsSync(extConfigPath)).toBe(true);
        },
      );
    });

    test("generates business configuration actions when business config schema is present", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithBusinessConfig, tempDir);

          const businessActionsDir = getActionsDir(
            tempDir,
            "commerce/configuration/1",
          );

          expect(existsSync(join(businessActionsDir, "config.js"))).toBe(true);
          expect(existsSync(join(businessActionsDir, "scope-tree.js"))).toBe(
            true,
          );
        },
      );
    });

    test("generates installation action with custom scripts loader", async () => {
      await withTempProject(
        { ...EMPTY_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run(configWithOneScript, tempDir);

          const actionsDir = getActionsDir(
            tempDir,
            EXTENSIBILITY_EXTENSION_POINT_ID,
          );

          const installationPath = join(actionsDir, "installation.js");
          expect(existsSync(installationPath)).toBe(true);

          const content = await readFile(installationPath, "utf-8");
          expect(content).toContain("customScriptsLoader");
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

    test("succeeds when a valid config file exists", async () => {
      await withTempProject(MINIMAL_PROJECT, async () => {
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

    test("exits with 1 when config file is invalid", async () => {
      await withTempProject(INVALID_PROJECT, async () => {
        await exec();
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
