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

import { join } from "node:path";

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test } from "vitest";

import { readJson } from "#ci/release/utils";
import syncPluginVersion from "#sync-plugin-version";

type PluginManifest = { version: string; repository?: string };

describe("sync-plugin-version.ts", () => {
  test("syncs tile.json and plugin.json versions to package.json", async () => {
    await withTempFiles(
      {
        ".claude-plugin/plugin.json": JSON.stringify({
          name: "commerce-app-management",
          repository: "https://github.com/adobe/aio-commerce-sdk",
          version: "1.1.0",
        }),
        "package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.2.0",
        }),
        "tile.json": JSON.stringify({
          name: "adobe/commerce-app-management",
          version: "1.1.0",
        }),
      },
      async (tempDir) => {
        await withChdir(tempDir, async () => {
          await syncPluginVersion();

          const [tileJson, pluginJson] = await Promise.all([
            readJson<PluginManifest>(join(tempDir, "tile.json")),
            readJson<PluginManifest>(
              join(tempDir, ".claude-plugin/plugin.json"),
            ),
          ]);

          expect(tileJson.version).toBe("1.2.0");
          expect(pluginJson.version).toBe("1.2.0");
          expect(pluginJson.repository).toBe(
            "https://github.com/adobe/aio-commerce-sdk",
          );
        });
      },
    );
  });

  test("does nothing when package.json is missing", async () => {
    await withTempFiles({}, async (tempDir) => {
      await withChdir(tempDir, async () => {
        await expect(syncPluginVersion()).resolves.toBeUndefined();
      });
    });
  });

  test("skips manifests that don't exist", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.2.0",
        }),
      },
      async (tempDir) => {
        await withChdir(tempDir, async () => {
          await expect(syncPluginVersion()).resolves.toBeUndefined();
        });
      },
    );
  });
});
