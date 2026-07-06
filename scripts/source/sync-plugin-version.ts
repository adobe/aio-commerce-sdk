#! /usr/bin/env node

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
import { join } from "node:path";

import { readJson, writeJson } from "./ci/release/utils.ts";

type PackageJson = { version: string };
type VersionedManifest = { version: string; [key: string]: unknown };

/** Syncs a Commerce plugin's tile.json and plugin.json versions to its package.json version. */
export default async function main() {
  const packageJsonPath = join(process.cwd(), "package.json");
  if (!existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = await readJson<PackageJson>(packageJsonPath);

  for (const manifestPath of [
    join(process.cwd(), "tile.json"),
    join(process.cwd(), ".claude-plugin/plugin.json"),
  ]) {
    if (!existsSync(manifestPath)) {
      continue;
    }

    const manifest = await readJson<VersionedManifest>(manifestPath);
    manifest.version = packageJson.version;
    await writeJson(manifestPath, manifest);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
