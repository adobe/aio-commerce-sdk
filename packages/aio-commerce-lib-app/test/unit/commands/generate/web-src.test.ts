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

import { readFile } from "node:fs/promises";

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { afterEach, describe, expect, test, vi } from "vitest";

import { prepareWebSourceImportAlias } from "#commands/generate/web-src";

const getProjectRootDirectory = vi.hoisted(() => vi.fn());

vi.mock("@aio-commerce-sdk/scripting-utils/project", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@aio-commerce-sdk/scripting-utils/project")
    >();
  return {
    ...actual,
    getProjectRootDirectory,
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("prepareWebSourceImportAlias", () => {
  test("throws when package.json is missing", async () => {
    await withTempFiles({}, async (tempDir) => {
      getProjectRootDirectory.mockReturnValue(tempDir);

      await expect(
        prepareWebSourceImportAlias({
          operations: {
            view: [
              {
                impl: "index.html",
                type: "web",
              },
            ],
          },
          web: "web-src",
        }),
      ).rejects.toThrow("Could not find package.json.");
    });
  });

  test("adds the #web import alias for a view operation", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({
          imports: {
            "#app.commerce.config": "./src/commerce-app-config.js",
          },
        }),
      },
      async (tempDir) => {
        getProjectRootDirectory.mockReturnValue(tempDir);

        await prepareWebSourceImportAlias({
          operations: {
            view: [
              {
                impl: "index.html",
                type: "web",
              },
            ],
          },
          web: "web-src",
        });

        await expect(
          readFile(`${tempDir}/package.json`, "utf-8").then(JSON.parse),
        ).resolves.toMatchObject({
          imports: {
            "#app.commerce.config": "./src/commerce-app-config.js",
            "#web/*": "./src/commerce-backend-ui-2/web-src/src/*",
          },
        });
      },
    );
  });
});
