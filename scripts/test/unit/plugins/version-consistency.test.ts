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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

const plugins = [
  "plugins/commerce/app-management",
  "plugins/commerce/app-migration",
];

describe("plugin version consistency", () => {
  for (const plugin of plugins) {
    test(`${plugin}: package.json version matches tile.json and .claude-plugin/plugin.json`, async () => {
      const [packageJson, tileJson, pluginJson] = await Promise.all([
        readFile(join(repoRoot, plugin, "package.json"), "utf-8").then(
          JSON.parse,
        ),
        readFile(join(repoRoot, plugin, "tile.json"), "utf-8").then(JSON.parse),
        readFile(
          join(repoRoot, plugin, ".claude-plugin/plugin.json"),
          "utf-8",
        ).then(JSON.parse),
      ]);

      expect(tileJson.version).toBe(packageJson.version);
      expect(pluginJson.version).toBe(packageJson.version);
    });
  }
});
