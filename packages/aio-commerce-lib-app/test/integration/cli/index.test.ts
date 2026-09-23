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
      cli.preAppRun("backend-ui/2"),
      cli.preAppDev("backend-ui/2"),
      cli.postAppDeploy("extensibility/1"),
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
          await cli[hookName]("backend-ui/2")();

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
      await cli.preAppRun("backend-ui/2")();
      await cli.preAppBuild("backend-ui/2")();

      expect(process.env.NODE_ENV).toBe("development");
      expect(readFileSync(join(tempDir, ".env"), "utf8")).toContain(
        "NODE_ENV=development",
      );
    });
  });

  describe("user hooks", () => {
    type UserHookCall = {
      source: string;
      args: unknown;
      context: unknown;
      nodeEnv?: string;
    };
    const calls = (): UserHookCall[] =>
      (globalThis as { __userHookCalls?: UserHookCall[] }).__userHookCalls ??
      [];

    const esmHook = (source: string) =>
      `export default (args, context) => { (globalThis.__userHookCalls ??= []).push({ source: "${source}", args, context, nodeEnv: process.env.NODE_ENV }); };`;

    beforeEach(() => {
      (globalThis as { __userHookCalls?: UserHookCall[] }).__userHookCalls = [];
    });

    test("runs the project root hook after ours with the CLI argument and the extension point", async () => {
      await withTempProject(
        {
          ".env": "NODE_ENV=production\n",
          "hooks/pre-app-run.mjs": esmHook("root"),
          "package.json": "{}",
        },
        async () => {
          await cli.preAppRun("backend-ui/2")({ config: { name: "app" } });

          expect(calls()).toEqual([
            {
              args: { config: { name: "app" } },
              context: { extensionPoint: "commerce/backend-ui/2" },
              nodeEnv: "development",
              source: "root",
            },
          ]);
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });

    test("prefers the extension point hook over the project root hook", async () => {
      await withTempProject(
        {
          "hooks/pre-app-run.mjs": esmHook("root"),
          "package.json": "{}",
          "src/commerce-backend-ui-2/hooks/pre-app-run.mjs":
            esmHook("extension"),
        },
        async () => {
          await cli.preAppRun("backend-ui/2")();

          expect(calls().map(({ source }) => source)).toEqual(["extension"]);
        },
      );
    });

    test.each([
      [
        "cjs",
        'module.exports = (args, context) => { (globalThis.__userHookCalls ??= []).push({ source: "cjs", args, context }); };',
      ],
      [
        "ts",
        'export default (args: unknown, context: { extensionPoint: string }): void => { ((globalThis as any).__userHookCalls ??= []).push({ source: "ts", args, context }); };',
      ],
    ])("loads %s hook files", async (extension, content) => {
      await withTempProject(
        { [`hooks/pre-app-dev.${extension}`]: content, "package.json": "{}" },
        async () => {
          await cli.preAppDev("backend-ui/2")();

          expect(calls().map(({ source }) => source)).toEqual([extension]);
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });

    test("exits with 1 when a folder has more than one file for the same hook", async () => {
      await withTempProject(
        {
          "hooks/pre-app-run.js": esmHook("js"),
          "hooks/pre-app-run.ts": esmHook("ts"),
          "package.json": "{}",
        },
        async () => {
          await cli.preAppRun("backend-ui/2")();

          expect(calls()).toEqual([]);
          expect(errorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: expect.stringContaining(
                'more than one "pre-app-run" hook file',
              ),
            }),
          );
          expect(exitSpy).toHaveBeenCalledWith(1);
        },
      );
    });

    test("exits with 1 when the hook file doesn't export a function", async () => {
      await withTempProject(
        { "hooks/pre-app-run.mjs": "export default 42;", "package.json": "{}" },
        async () => {
          await cli.preAppRun("backend-ui/2")();

          expect(errorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: expect.stringContaining("must export a function"),
            }),
          );
          expect(exitSpy).toHaveBeenCalledWith(1);
        },
      );
    });

    test("exits with 1 when the user hook throws", async () => {
      await withTempProject(
        {
          "hooks/pre-app-run.mjs":
            'export default () => { throw new Error("user hook failed"); };',
          "package.json": "{}",
        },
        async () => {
          await cli.preAppRun("backend-ui/2")();

          expect(errorSpy).toHaveBeenCalledWith(
            expect.objectContaining({ message: "user hook failed" }),
          );
          expect(exitSpy).toHaveBeenCalledWith(1);
        },
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
