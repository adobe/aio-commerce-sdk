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

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { makeTemplateFiles } from "#test/fixtures/commands";
import { configWithAdminUiMenu } from "#test/fixtures/config";
import {
  INVALID_PROJECT,
  MINIMAL_PROJECT,
  makeProjectFiles,
  withTempProject,
} from "#test/fixtures/project";

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

vi.mock("@aio-commerce-sdk/scripting-utils/env", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@aio-commerce-sdk/scripting-utils/env")
  >()),
  syncImsCredentials: vi.fn(),
}));

const ADMIN_UI_WEB_PROJECT = {
  ...makeProjectFiles(configWithAdminUiMenu),
  ...makeTemplateFiles(),
};

describe("cli", () => {
  let cli: typeof import("#cli/index");
  let errorSpy: ReturnType<typeof vi.fn>;

  const exitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);

  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "test");

    // The handlers keep dev-session state at module level.
    vi.resetModules();
    cli = await import("#cli/index");

    const { consola } = await import("consola");
    errorSpy = vi.spyOn(consola, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  test("exports hook factories that return async functions", () => {
    const hooks = [
      cli.preAppBuild("backend-ui/2"),
      cli.preAppRun(),
      cli.preAppDev(),
      cli.postAppDeploy(),
    ];

    for (const hook of hooks) {
      expect(hook).toBeTypeOf("function");
      expect(hook.constructor.name).toBe("AsyncFunction");
    }
  });

  test.each(["preAppRun", "preAppDev"] as const)(
    "%s sets NODE_ENV to development in the process and the .env",
    async (hookName) => {
      await withTempProject(
        { ".env": "NODE_ENV=production\n", "package.json": "{}" },
        async (tempDir) => {
          await cli[hookName]()();

          expect(process.env.NODE_ENV).toBe("development");
          expect(readFileSync(join(tempDir, ".env"), "utf8")).toContain(
            "NODE_ENV=development",
          );
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    },
  );

  test("preAppBuild sets NODE_ENV to production for a backend-ui/2 web build", async () => {
    await withTempProject(ADMIN_UI_WEB_PROJECT, async (tempDir) => {
      await cli.preAppBuild("backend-ui/2")();

      expect(process.env.NODE_ENV).toBe("production");
      expect(readFileSync(join(tempDir, ".env"), "utf8")).toContain(
        "NODE_ENV=production",
      );
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  test("preAppBuild keeps NODE_ENV as development after preAppRun", async () => {
    await withTempProject(ADMIN_UI_WEB_PROJECT, async (tempDir) => {
      await cli.preAppRun()();
      await cli.preAppBuild("backend-ui/2")();

      expect(process.env.NODE_ENV).toBe("development");
      expect(readFileSync(join(tempDir, ".env"), "utf8")).toContain(
        "NODE_ENV=development",
      );
    });
  });

  test("logs validation errors and exits with 1", async () => {
    await withTempProject(INVALID_PROJECT, async () => {
      await cli.preAppBuild("extensibility/1")();

      expect(errorSpy).toHaveBeenCalledWith(expect.any(String));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  test("logs other errors and exits with 1", async () => {
    await withTempProject(MINIMAL_PROJECT, async () => {
      // @ts-expect-error Testing with an invalid extension value
      await cli.preAppBuild("unknown/1")();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Unsupported extension"),
        }),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
