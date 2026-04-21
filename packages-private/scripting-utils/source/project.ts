/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * This module exports shared project utilities for the AIO Commerce SDK.
 * @packageDocumentation
 */

import { existsSync } from "node:fs";
import { access, mkdir, readFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";

import { resolveCommand } from "package-manager-detector";
import { detect } from "package-manager-detector/detect";

import type { PackageJson } from "type-fest";

/**
 * Find a file by walking up parent directories
 * @param name - The file name to search for (or array of file names)
 * @param options - Search options
 * @returns The path to the file, or undefined if not found
 */
export async function findUp(
  name: string | string[],
  options: { cwd?: string; stopAt?: string } = {},
): Promise<string | undefined> {
  const names = Array.isArray(name) ? name : [name];
  const cwd = options.cwd || process.cwd();
  const { root } = parse(cwd);
  const stopAt = options.stopAt || root;

  let currentDir = cwd;

  while (true) {
    // Try to find any of the files in the current directory
    for (const fileName of names) {
      const filePath = join(currentDir, fileName);
      try {
        await access(filePath);
        return filePath;
      } catch {
        // File doesn't exist, continue to next file name
      }
    }

    // Stop if we've reached the stop directory or root
    if (currentDir === stopAt || currentDir === root) {
      return;
    }

    // Move up one directory
    currentDir = dirname(currentDir);
  }
}

/**
 * Find the nearest package.json file in the current working directory or its parents
 * @param cwd The current working directory
 */
export async function findNearestPackageJson(cwd = process.cwd()) {
  const packageJsonPath = await findUp("package.json", { cwd });

  if (!packageJsonPath) {
    return null;
  }

  return packageJsonPath;
}

/**
 * Read the package.json file
 * @param cwd The current working directory
 */
export async function readPackageJson(
  cwd = process.cwd(),
): Promise<PackageJson | null> {
  const packageJsonPath = await findNearestPackageJson(cwd);
  if (!packageJsonPath) {
    return null;
  }

  return JSON.parse(await readFile(packageJsonPath, "utf-8"));
}

/**
 * Check if the current working directory is an ESM project.
 * @param cwd The current working directory
 */
export async function isESM(cwd = process.cwd()) {
  const packageJson = await readPackageJson(cwd);
  if (!packageJson) {
    throw new Error(
      "Could not find a `package.json` file in the current working directory or its parents.",
    );
  }

  return packageJson.type === "module";
}

/**
 * Get the root directory of the project
 * @param cwd The current working directory
 */
export async function getProjectRootDirectory(cwd = process.cwd()) {
  const packageJsonPath = await findNearestPackageJson(cwd);
  if (!packageJsonPath) {
    throw new Error(
      "Could not find a the root directory of the project. `package.json` file not found.",
    );
  }

  return dirname(packageJsonPath);
}

/**
 * Create the output directory for the given file or folder (relative to the project root)
 * @param fileOrFolder - The file or folder to create
 */
export async function makeOutputDirFor(fileOrFolder: string) {
  const rootDirectory = await getProjectRootDirectory();
  const outputDir = join(rootDirectory, fileOrFolder);

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  return outputDir;
}

// App Builder targets Node.js — unsupported detections (e.g. deno) fall back to npm.
const VALID_PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

/** The package manager used to install the package */
export type PackageManager = (typeof VALID_PACKAGE_MANAGERS)[number];

/**
 * Type guard to assert that a value is a valid PackageManager. Throws an error if the value is not valid.
 * @param value - The value to validate
 */
function isValidPackageManager(
  value: string | undefined,
): value is PackageManager {
  return (
    value !== undefined &&
    VALID_PACKAGE_MANAGERS.includes(value as PackageManager)
  );
}

/**
 * Detect the package manager for a project.
 *
 * Delegates to `package-manager-detector`, which inspects lock files, the
 * `packageManager` / `devEngines.packageManager` fields in package.json, and
 * installation metadata. Yarn berry and pnpm v6 are collapsed into their
 * base agent name — the exec commands we emit are identical across versions
 * for our use cases.
 */
export async function detectPackageManager(
  cwd = process.cwd(),
): Promise<PackageManager> {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const result = await detect({ cwd: rootDirectory });

  if (isValidPackageManager(result?.name)) {
    return result.name;
  }

  // Unsupported or undetectable package manager — default to npm, which is the most common denominator and supported by all platforms.
  return "npm";
}

/**
 * Get the exec command that runs a **locally installed** binary from
 * `node_modules/.bin` for the given package manager.
 */
export function getExecCommand(packageManager: PackageManager): string {
  const resolved = resolveCommand(packageManager, "execute-local", []);
  if (!resolved) {
    return "npx";
  }

  return [resolved.command, ...resolved.args].filter(Boolean).join(" ");
}

/**
 * Get the command to install the given dependencies with the given package
 * manager (e.g. `pnpm add foo bar`, `npm i foo bar`).
 */
export function getInstallCommand(
  packageManager: PackageManager,
  packages: string[],
): string {
  const resolved = resolveCommand(packageManager, "add", packages);
  if (!resolved) {
    return ["npm", "install", ...packages].join(" ");
  }

  return [resolved.command, ...resolved.args].filter(Boolean).join(" ");
}
