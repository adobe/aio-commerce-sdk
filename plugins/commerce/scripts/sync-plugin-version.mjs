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

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PLUGIN_ROOT = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const packageJson = await readJson(join(PLUGIN_ROOT, "package.json"));
  const tileJsonPath = join(PLUGIN_ROOT, "tile.json");
  const pluginJsonPath = join(PLUGIN_ROOT, ".claude-plugin/plugin.json");

  const tileJson = await readJson(tileJsonPath);
  tileJson.version = packageJson.version;
  await writeJson(tileJsonPath, tileJson);

  const pluginJson = await readJson(pluginJsonPath);
  pluginJson.version = packageJson.version;
  await writeJson(pluginJsonPath, pluginJson);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
