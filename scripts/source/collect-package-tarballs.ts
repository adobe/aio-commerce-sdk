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

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type PackageManifest = {
  name: string;
  version: string;
  scripts?: { pack?: string };
};

/**
 * Copies tarballs for packages with a pack script into the shared local test directory.
 * @param repositoryRoot - Monorepo root directory.
 */
export function collectPackageTarballs(
  repositoryRoot = process.cwd(),
): string[] {
  const packagesDirectory = join(repositoryRoot, "packages");
  const destinationDirectory = join(repositoryRoot, ".local-testing");
  const copiedTarballs: string[] = [];

  for (const entry of readdirSync(packagesDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDirectory = join(packagesDirectory, entry.name);
    const manifestPath = join(packageDirectory, "package.json");
    if (!existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(
      readFileSync(manifestPath, "utf8"),
    ) as PackageManifest;
    if (!manifest.scripts?.pack) {
      continue;
    }

    const packageName = manifest.name.startsWith("@")
      ? manifest.name.slice(1)
      : manifest.name;
    const tarballName = `${packageName.replace("/", "-")}-${manifest.version}.tgz`;
    const tarballPath = join(packageDirectory, tarballName);
    if (!existsSync(tarballPath)) {
      throw new Error(
        `Expected package tarball was not created: ${tarballPath}`,
      );
    }

    mkdirSync(destinationDirectory, { recursive: true });
    copyFileSync(tarballPath, join(destinationDirectory, tarballName));
    copiedTarballs.push(tarballName);
  }

  process.stdout.write(
    `Collected ${copiedTarballs.length} package tarballs in ${destinationDirectory}\n`,
  );
  return copiedTarballs;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  collectPackageTarballs();
}
