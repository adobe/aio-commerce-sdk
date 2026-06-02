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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { consola } from "consola";

import spec from "#openapi.json" with { type: "json" };

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = join(PACKAGE_DIR, "docs/openapi.json");

/**
 * This script syncs the version in the OpenAPI spec's info.x-meta.packageVersion field with the version in package.json.
 * This allows us to track which version of the package the OpenAPI spec was generated with, which is useful for caching and debugging purposes.
 */
async function main() {
  // Read the package.json to get the current version of the package
  const pkg = JSON.parse(
    await readFile(join(PACKAGE_DIR, "package.json"), "utf-8"),
  );

  // Update the OpenAPI spec with the current package version in the x-meta field
  const clone = structuredClone(spec);
  clone.info["x-meta"] = {
    packageVersion: pkg.version,
  };

  await writeFile(SPEC_PATH, `${JSON.stringify(clone, null, 2)}\n`);
}

main().catch((error) => {
  consola.error("Error syncing OpenAPI spec version:", error);
  process.exit(1);
});
