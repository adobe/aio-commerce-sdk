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

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test } from "vitest";

import { collectPackageTarballs } from "#collect-package-tarballs";

describe("collectPackageTarballs", () => {
  test("copies tarballs for packable packages into the shared local test folder", async () => {
    await withTempFiles(
      {
        "packages/a/adobe-a-1.2.3.tgz": "package a",
        "packages/a/package.json": JSON.stringify({
          name: "@adobe/a",
          scripts: { pack: "pnpm pack" },
          version: "1.2.3",
        }),
        "packages/b/adobe-b-4.5.6.tgz": "package b",
        "packages/b/package.json": JSON.stringify({
          name: "@adobe/b",
          scripts: { pack: "pnpm pack" },
          version: "4.5.6",
        }),
        "packages/not-packable/adobe-not-packable-1.0.0.tgz": "old artifact",
        "packages/not-packable/package.json": JSON.stringify({
          name: "@adobe/not-packable",
          version: "1.0.0",
        }),
      },
      (repositoryRoot) => {
        const copiedTarballs = collectPackageTarballs(repositoryRoot);
        const destinationDirectory = join(repositoryRoot, ".local-testing");

        expect(copiedTarballs).toEqual([
          "adobe-a-1.2.3.tgz",
          "adobe-b-4.5.6.tgz",
        ]);
        expect(
          readFileSync(join(destinationDirectory, "adobe-a-1.2.3.tgz"), "utf8"),
        ).toBe("package a");
        expect(
          readFileSync(join(destinationDirectory, "adobe-b-4.5.6.tgz"), "utf8"),
        ).toBe("package b");
        expect(
          existsSync(
            join(destinationDirectory, "adobe-not-packable-1.0.0.tgz"),
          ),
        ).toBe(false);
      },
    );
  });

  test("throws when a packable package tarball is missing", async () => {
    await withTempFiles(
      {
        "packages/a/package.json": JSON.stringify({
          name: "@adobe/a",
          scripts: { pack: "pnpm pack" },
          version: "1.2.3",
        }),
      },
      (repositoryRoot) => {
        expect(() => collectPackageTarballs(repositoryRoot)).toThrow(
          "Expected package tarball was not created",
        );
      },
    );
  });
});
