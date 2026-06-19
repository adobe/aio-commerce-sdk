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

import { describe, expect, test, vi } from "vitest";

import {
  collectEntries,
  fetchPackageDiff,
  resolvePackagePath,
  resolvePrevTag,
} from "#input";

import type { ExecInterface } from "#types";

function makeExec(
  overrides: Partial<Record<string, { stdout: string; exitCode: number }>> = {},
): ExecInterface {
  return {
    getExecOutput: vi
      .fn()
      .mockImplementation((_cmd: string, args?: string[]) => {
        const key = args?.join(" ") ?? "";
        const defaults = { stdout: "", stderr: "", exitCode: 0 };
        for (const [pattern, result] of Object.entries(overrides)) {
          if (key.includes(pattern)) {
            return Promise.resolve({ ...defaults, ...result });
          }
        }
        return Promise.resolve(defaults);
      }),
  };
}

const SAMPLE_DIFF = `
diff --git a/packages/aio-commerce-lib-core/source/index.ts b/packages/aio-commerce-lib-core/source/index.ts
index abc123..def456 100644
--- a/packages/aio-commerce-lib-core/source/index.ts
+++ b/packages/aio-commerce-lib-core/source/index.ts
@@ -1,3 +1,5 @@
+export { newHelper } from "./new-helper.ts";
 export { existingHelper } from "./existing-helper.ts";
`.trim();

describe("resolvePrevTag", () => {
  test("returns the previous tag from git describe output", async () => {
    const exec = makeExec({
      describe: { stdout: "@adobe/aio-commerce-lib-core@1.0.0\n", exitCode: 0 },
    });
    const tag = await resolvePrevTag(
      exec,
      "@adobe/aio-commerce-lib-core",
      "@adobe/aio-commerce-lib-core@1.1.0",
    );
    expect(tag).toBe("@adobe/aio-commerce-lib-core@1.0.0");
  });

  test("returns undefined when no previous tag exists", async () => {
    const exec = makeExec({ describe: { stdout: "", exitCode: 128 } });
    const tag = await resolvePrevTag(
      exec,
      "@adobe/aio-commerce-lib-core",
      "@adobe/aio-commerce-lib-core@1.0.0",
    );
    expect(tag).toBeUndefined();
  });

  test("excludes pre-release tags via --exclude", async () => {
    const exec = makeExec({ describe: { stdout: "", exitCode: 128 } });
    await resolvePrevTag(
      exec,
      "@adobe/aio-commerce-lib-core",
      "@adobe/aio-commerce-lib-core@1.1.0",
    );
    const args: string[] = (exec.getExecOutput as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(args).toContain("--exclude=@adobe/aio-commerce-lib-core@*-*");
  });
});

describe("fetchPackageDiff", () => {
  test("runs git diff between prevTag and newTag for the whole package", async () => {
    const exec = makeExec({ diff: { stdout: SAMPLE_DIFF, exitCode: 0 } });
    const result = await fetchPackageDiff(
      exec,
      "packages/aio-commerce-lib-core",
      "@adobe/aio-commerce-lib-core@1.1.0",
      "@adobe/aio-commerce-lib-core@1.0.0",
    );
    expect(result).toContain("newHelper");
    const args: string[] = (exec.getExecOutput as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(args).toContain("packages/aio-commerce-lib-core");
    expect(args.join(" ")).not.toContain("CHANGELOG");
  });
});

describe("collectEntries", () => {
  test("collects entries for all published packages in parallel", async () => {
    const exec: ExecInterface = {
      getExecOutput: vi
        .fn()
        .mockImplementation((_cmd: string, args: string[]) => {
          const argStr = args.join(" ");
          if (argStr.includes("describe")) {
            if (argStr.includes("aio-commerce-lib-core")) {
              return Promise.resolve({
                stdout: "@adobe/aio-commerce-lib-core@1.0.0\n",
                stderr: "",
                exitCode: 0,
              });
            }
            return Promise.resolve({
              stdout: "@adobe/aio-commerce-sdk@1.9.0\n",
              stderr: "",
              exitCode: 0,
            });
          }
          if (argStr.includes("aio-commerce-lib-core")) {
            return Promise.resolve({
              stdout: SAMPLE_DIFF,
              stderr: "",
              exitCode: 0,
            });
          }
          if (argStr.includes("aio-commerce-sdk")) {
            return Promise.resolve({
              stdout: SAMPLE_DIFF,
              stderr: "",
              exitCode: 0,
            });
          }
          return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
        }),
    };

    const entries = await collectEntries(exec, [
      { name: "@adobe/aio-commerce-lib-core", version: "1.1.0" },
      { name: "@adobe/aio-commerce-sdk", version: "2.0.0" },
    ]);

    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.package)).toContain(
      "@adobe/aio-commerce-lib-core",
    );
    expect(entries.map((e) => e.package)).toContain("@adobe/aio-commerce-sdk");
  });

  test("throws when the package diff is empty", async () => {
    const exec: ExecInterface = {
      getExecOutput: vi
        .fn()
        .mockImplementation((_cmd: string, args: string[]) => {
          if (args.join(" ").includes("describe")) {
            return Promise.resolve({
              stdout: "@adobe/aio-commerce-lib-core@0.9.0\n",
              stderr: "",
              exitCode: 0,
            });
          }
          return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
        }),
    };
    await expect(
      collectEntries(exec, [
        { name: "@adobe/aio-commerce-lib-core", version: "1.0.0" },
      ]),
    ).rejects.toThrow(
      "No changes found for @adobe/aio-commerce-lib-core@1.0.0",
    );
  });

  test("throws when no previous tag exists for a package", async () => {
    const exec = makeExec({ describe: { stdout: "", exitCode: 128 } });
    await expect(
      collectEntries(exec, [
        { name: "@adobe/aio-commerce-lib-core", version: "1.0.0" },
      ]),
    ).rejects.toThrow(
      "No previous release tag found for @adobe/aio-commerce-lib-core@1.0.0",
    );
  });
});

describe("resolvePackagePath", () => {
  test("strips the @adobe/ scope prefix", () => {
    expect(resolvePackagePath("@adobe/aio-commerce-lib-core")).toBe(
      "packages/aio-commerce-lib-core",
    );
  });

  test("handles the meta-package", () => {
    expect(resolvePackagePath("@adobe/aio-commerce-sdk")).toBe(
      "packages/aio-commerce-sdk",
    );
  });
});
