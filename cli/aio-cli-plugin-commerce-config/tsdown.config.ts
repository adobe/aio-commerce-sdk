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

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { defineConfig } from "tsdown";

// oclif discovers commands by FILE PATH, so each command must be its own output
// file under `dist/commands/...`. A bundler flattens shared entries by default, so
// we build an explicit entry map keyed by the desired output path (relative to src).
function collectCommandEntries(dir: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      Object.assign(entries, collectCommandEntries(full));
    } else if (name.endsWith(".ts")) {
      const key = relative("src", full).replace(/\.ts$/, "").split(sep).join("/");
      entries[key] = full;
    }
  }
  return entries;
}

export default defineConfig({
  entry: collectCommandEntries("src/commands"),
  outDir: "dist",
  format: "esm",
  platform: "node",
  target: "node22",
  dts: false,
  clean: true,
  treeshake: true,

  // Bundle workspace source into the plugin so it runs under `aio` without publishing.
  // Locally, a published package's `exports` resolve to TypeScript source that plain
  // `node`/`aio` cannot load; bundling reads that source at build time instead.
  // In production the plugin would depend on the published package and externalize it.
  deps: {
    alwaysBundle: [/^@adobe\/aio-commerce-lib-config(\/|$)/, /^@aio-commerce-sdk\//],
    neverBundle: [/^@oclif\/core$/, /^consola$/],
  },
});
