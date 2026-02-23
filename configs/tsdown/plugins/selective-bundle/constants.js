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

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The dir where the private packages are located.
export const PRIVATE_PACKAGES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../packages-private",
);

// Get the list of private packages in the private packages directory.
export const PRIVATE_PACKAGES = (
  await readdir(PRIVATE_PACKAGES_DIR, {
    withFileTypes: true,
  })
)
  .filter((dir) => dir.isDirectory())
  .map((dir) => ({
    name: dir.name,
    path: join(PRIVATE_PACKAGES_DIR, dir.name),
  }));

// Info about the private packages, including their dependencies and peer dependencies.
export const PRIVATE_PACKAGES_INFO = await Promise.all(
  PRIVATE_PACKAGES.map(async (pkg) => {
    /** @type {import("type-fest").PackageJson} */
    const pkgJson = JSON.parse(
      await readFile(join(pkg.path, "package.json"), "utf-8"),
    );

    return {
      name: `${pkgJson.name}`,
      path: pkg.path,

      deps: {
        ...pkgJson.dependencies,
        ...pkgJson.peerDependencies,
      },
    };
  }),
);

/**
 * Flattened lookup of every dependency declared across all private packages.
 * @type {Map<string, { source: string; version: string }>}
 */
export const PRIVATE_DEPS_LOOKUP = new Map(
  PRIVATE_PACKAGES_INFO.flatMap((pkg) =>
    Object.entries(pkg.deps).map(([dep, version]) => [
      dep,
      { source: pkg.name, version },
    ]),
  ),
);
