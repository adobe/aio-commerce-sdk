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
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import { exec, run } from "#commands/hooks/pre-app-build";
import { getManifestPath, getSchemaPath } from "#commands/utils";
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

/** The worker `runtimeAction` declared by the `configWithFullAdminUiSdk` fixture. */
const WORKER_RUNTIME_ACTION = "customers/export-customers";

/** Builds an app.config.yaml declaring a single backend-ui/2 workerProcess `impl`. */
function backendUiAppConfigYaml(impl: string) {
  return [
    "extensions:",
    "  commerce/backend-ui/2:",
    "    operations:",
    "      workerProcess:",
    "        - type: action",
    `          impl: ${impl}`,
  ].join("\n");
}

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

    test("runs successfully for backend-ui/2 when worker runtimeAction is declared", async () => {
      await withTempProject(
        makeProjectFiles(configWithFullAdminUiSdk, "esm", {
          "app.config.yaml": backendUiAppConfigYaml(WORKER_RUNTIME_ACTION),
          ...makeTemplateFiles(),
        }),
        async () => {
          await expect(run("backend-ui/2")).resolves.toBeUndefined();
        },
      );
    });

    test("throws CommerceSdkValidationError for backend-ui/2 when worker runtimeAction is not declared", async () => {
      await withTempProject(
        makeProjectFiles(configWithFullAdminUiSdk, "esm", {
          // Declares a different impl, so the fixture's worker runtimeAction is unmatched.
          "app.config.yaml": backendUiAppConfigYaml("customers/other"),
          ...makeTemplateFiles(),
        }),
        async () => {
          // The error names the unmatched runtimeAction, not the declared impl.
          await expect(run("backend-ui/2")).rejects.toThrow(
            WORKER_RUNTIME_ACTION,
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

    test("runs successfully for backend-ui/2", async () => {
      vi.stubEnv("EXTENSION", "backend-ui/2");

      await withTempProject(
        makeProjectFiles(configWithFullAdminUiSdk, "esm", {
          "app.config.yaml": backendUiAppConfigYaml(WORKER_RUNTIME_ACTION),
          ...makeTemplateFiles(),
        }),
        async () => {
          await exec();
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });

    test("exits with 1 for backend-ui/2 when worker runtimeAction is not declared", async () => {
      vi.stubEnv("EXTENSION", "backend-ui/2");

      await withTempProject(
        makeProjectFiles(configWithFullAdminUiSdk, "esm", {
          "app.config.yaml": backendUiAppConfigYaml("customers/other"),
          ...makeTemplateFiles(),
        }),
        async () => {
          await exec();
          expect(exitSpy).toHaveBeenCalledWith(1);
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
