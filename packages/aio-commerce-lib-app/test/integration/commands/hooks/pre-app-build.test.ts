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
  BACKEND_UI_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import { exec, run } from "#commands/hooks/pre-app-build";
import {
  getAdminUiSdkRegistrationActionPath,
  getManifestPath,
  getSchemaPath,
} from "#commands/utils";
import { makeTemplateFiles } from "#test/fixtures/commands";
import {
  configWithBusinessConfig,
  configWithCommerceEventing,
  configWithFullAdminUiSdk,
} from "#test/fixtures/config";
import {
  businessConfigActionFile,
  EMPTY_PROJECT,
  extensibilityActionFile,
  INVALID_PROJECT,
  MINIMAL_PROJECT,
  makeExtConfigFile,
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
    test("generates manifest and actions for extensibility/1", async () => {
      const actions = ["app-config", "installation"];
      const extensibilityProject = {
        ...makeProjectFiles(configWithCommerceEventing),
        ...makeTemplateFiles(),
        ...makeExtConfigFile(EXTENSIBILITY_EXTENSION_POINT_ID, actions),
      };

      await withTempProject(extensibilityProject, async (tempDir) => {
        await run("extensibility/1", tempDir);

        const manifestPath = join(tempDir, getManifestPath());
        const appConfigPath = extensibilityActionFile(tempDir, "app-config");
        const installationPath = extensibilityActionFile(
          tempDir,
          "installation",
        );

        expect(existsSync(appConfigPath)).toBe(true);
        expect(existsSync(installationPath)).toBe(true);
        expect(existsSync(manifestPath)).toBe(true);

        const parsed = JSON.parse(await readFile(manifestPath, "utf-8"));
        expect(parsed).toEqual(configWithCommerceEventing);
      });
    });

    test("generates schema and actions for configuration/1", async () => {
      const actions = ["config", "scope-tree"];
      const businessConfigProject = {
        ...makeProjectFiles(configWithBusinessConfig),
        ...makeTemplateFiles(),
        ...makeExtConfigFile(CONFIGURATION_EXTENSION_POINT_ID, actions),
      };

      await withTempProject(businessConfigProject, async (tempDir) => {
        await run("configuration/1", tempDir);

        const schemaPath = join(tempDir, getSchemaPath());
        const configActionPath = businessConfigActionFile(tempDir, "config");
        const scopeTreeActionPath = businessConfigActionFile(
          tempDir,
          "scope-tree",
        );

        expect(existsSync(configActionPath)).toBe(true);
        expect(existsSync(scopeTreeActionPath)).toBe(true);
        expect(existsSync(schemaPath)).toBe(true);

        const parsed = JSON.parse(await readFile(schemaPath, "utf-8"));
        expect(parsed).toEqual(configWithBusinessConfig.businessConfig.schema);
      });
    });

    test("generates backend-ui registration action for backend-ui/1", async () => {
      await withTempProject(
        {
          ...makeProjectFiles(configWithFullAdminUiSdk),
          ...makeTemplateFiles(),
        },
        async (tempDir) => {
          await run("backend-ui/1");

          const registrationPath = join(
            tempDir,
            getAdminUiSdkRegistrationActionPath(BACKEND_UI_EXTENSION_POINT_ID),
          );

          expect(existsSync(registrationPath)).toBe(true);

          const content = await readFile(registrationPath, "utf-8");
          expect(content).toContain("registrationRuntimeAction");
          expect(content).toContain("my_app::first");
        },
      );
    });

    test("does not generate backend-ui registration action when adminUiSdk is absent", async () => {
      await withTempProject(
        { ...MINIMAL_PROJECT, ...makeTemplateFiles() },
        async (tempDir) => {
          await run("backend-ui/1");

          const registrationPath = join(
            tempDir,
            getAdminUiSdkRegistrationActionPath(BACKEND_UI_EXTENSION_POINT_ID),
          );

          expect(existsSync(registrationPath)).toBe(false);
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
      await withTempProject(
        {
          ...MINIMAL_PROJECT,
          ...makeTemplateFiles(),
          ...makeExtConfigFile(EXTENSIBILITY_EXTENSION_POINT_ID, [
            "app-config",
          ]),
        },
        async () => {
          await exec();
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });

    test("runs successfully for configuration/1", async () => {
      vi.stubEnv("EXTENSION", "configuration/1");

      await withTempProject(
        {
          ...makeProjectFiles(configWithBusinessConfig),
          ...makeTemplateFiles(),
          ...makeExtConfigFile(CONFIGURATION_EXTENSION_POINT_ID, [
            "config",
            "scope-tree",
          ]),
        },
        async () => {
          await exec();
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });

    test("runs successfully for backend-ui/1", async () => {
      vi.stubEnv("EXTENSION", "backend-ui/1");

      await withTempProject(
        {
          ...makeProjectFiles(configWithFullAdminUiSdk),
          ...makeTemplateFiles(),
        },
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
