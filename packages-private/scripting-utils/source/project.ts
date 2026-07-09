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

import NpmPackageJson from "@npmcli/package-json";
import { getPackageInfo } from "local-pkg";
import { resolveCommand } from "package-manager-detector";
import { detect, getUserAgent } from "package-manager-detector/detect";
import {
  validRange as isValidSemverRange,
  satisfies as satisfiesSemverRange,
} from "semver";

import type { PackageJson } from "type-fest";

export type PackageDependency = {
  /** Package name as it appears in package.json. */
  name: string;

  /** Version specifier to write or install, compared by exact string equality. */
  version: string;
};

export type PackageInstallOptions = {
  /** Install packages as development dependencies. */
  dev?: boolean;
};

type PackageJsonDependencies = NonNullable<PackageJson["dependencies"]>;
type WritablePackageJsonDependencies = Record<string, string>;

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

  for (;;) {
    // Try to find any of the files in the current directory
    for (const fileName of names) {
      const filePath = join(currentDir, fileName);
      try {
        // biome-ignore lint/performance/noAwaitInLoops: must probe file names in priority order and stop at the first match
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
 * Load the nearest package.json file with npmcli's package.json helper.
 * @param cwd The current working directory
 */
export async function loadPackageJson(cwd = process.cwd()) {
  const packageJsonPath = await findNearestPackageJson(cwd);
  if (!packageJsonPath) {
    return null;
  }

  return NpmPackageJson.load(dirname(packageJsonPath));
}

/**
 * Convert package.json dependencies into a dependency map that can be written back.
 * @param dependencies - Dependency map read from package.json.
 */
function toWritablePackageJsonDependencies(
  dependencies: PackageJsonDependencies,
): WritablePackageJsonDependencies {
  return Object.fromEntries(
    Object.entries(dependencies).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
}

/**
 * Resolve the installed package version from a project root.
 * @param packageName - Package name to resolve.
 * @param cwd - Project directory to resolve from.
 */
export async function getInstalledPackageVersion(
  packageName: string,
  cwd = process.cwd(),
) {
  const packageInfo = await getPackageInfo(packageName, { paths: [cwd] });
  return packageInfo?.version ?? null;
}

type PackageDependencyInstallPlan = {
  missing: PackageDependency[];
  incompatible: Array<
    PackageDependency & {
      installedVersion: string;
    }
  >;
};

/**
 * Resolve which dependencies are missing or installed with incompatible versions.
 *
 * Installed package versions are compared with `semver.satisfies`. Declared
 * package.json ranges are not used as compatibility proof because they can
 * differ from what is actually installed.
 *
 * @param requiredDependencies - Dependencies that should exist.
 * @param cwd - Project directory to resolve installed packages from.
 */
export async function getPackageDependencyInstallPlan(
  requiredDependencies: readonly PackageDependency[],
  cwd = process.cwd(),
): Promise<PackageDependencyInstallPlan> {
  const plan: PackageDependencyInstallPlan = {
    incompatible: [],
    missing: [],
  };

  const installedVersions = await Promise.all(
    requiredDependencies.map((dependency) =>
      getInstalledPackageVersion(dependency.name, cwd),
    ),
  );

  requiredDependencies.forEach((dependency, index) => {
    const installedVersion = installedVersions[index];

    if (installedVersion === null) {
      plan.missing.push(dependency);
      return;
    }

    // Dist-tags (e.g. "latest") aren't semver ranges, so any installed version
    // is considered compatible.
    if (isValidSemverRange(dependency.version) === null) {
      return;
    }

    if (
      !satisfiesSemverRange(installedVersion, dependency.version, {
        includePrerelease: true,
      })
    ) {
      plan.incompatible.push({ ...dependency, installedVersion });
    }
  });

  return plan;
}

/**
 * Merge required dependencies into a package.json dependency map when they are missing.
 *
 * @param dependencies - Dependency map to update.
 * @param requiredDependencies - Dependencies that should exist.
 * @param dependencyMaps - Package dependency maps to compare against.
 */
export function mergePackageJsonDependencies(
  dependencies: PackageJsonDependencies,
  requiredDependencies: readonly PackageDependency[],
  dependencyMaps: readonly PackageJsonDependencies[] = [dependencies],
) {
  const nextDependencies = toWritablePackageJsonDependencies(dependencies);

  for (const { name, version } of requiredDependencies) {
    if (!dependencyMaps.some((dependencyMap) => name in dependencyMap)) {
      nextDependencies[name] = version;
    }
  }

  return nextDependencies;
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

const VALID_PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
const DEV_DEPENDENCY_INSTALL_FLAGS = {
  bun: "--dev",
  npm: "--save-dev",
  pnpm: "--save-dev",
  yarn: "--dev",
} as const satisfies Record<PackageManager, string>;

/** The package manager used to install the package */
export type PackageManager = (typeof VALID_PACKAGE_MANAGERS)[number];

/**
 * Type guard asserting that a value is a supported `PackageManager`.
 * @param value - The value to check
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
 * @param cwd - Directory to start detection from; defaults to `process.cwd()`
 */
export async function detectPackageManager(
  cwd = process.cwd(),
): Promise<PackageManager> {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const result = await detect({ cwd: rootDirectory });

  if (isValidPackageManager(result?.name)) {
    return result.name;
  }

  // Greenfield scaffolds have no on-disk evidence; fall back to the invoking PM.
  const fromUserAgent = getUserAgent() ?? undefined;
  if (isValidPackageManager(fromUserAgent)) {
    return fromUserAgent;
  }

  return "npm";
}

/**
 * Get the exec command that runs a **locally installed** binary from
 * `node_modules/.bin` for the given package manager.
 * @param packageManager - The detected package manager
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
 * @param packageManager - The detected package manager
 * @param packages - Package specifiers to install (e.g. `["foo@^1.0"]`)
 * @param options - Install command options.
 */
export function getInstallCommand(
  packageManager: PackageManager,
  packages: string[],
  options: PackageInstallOptions = {},
): { command: string; args: string[] } {
  const installArgs = options.dev
    ? [DEV_DEPENDENCY_INSTALL_FLAGS[packageManager], ...packages]
    : packages;

  const resolved = resolveCommand(packageManager, "add", installArgs);
  return {
    args: resolved?.args.filter(Boolean) ?? ["install", ...installArgs],
    command: resolved?.command ?? "npm",
  };
}

/**
 * Get the command that installs a project's declared dependencies.
 * @param packageManager - The detected package manager
 */
export function getProjectInstallCommand(packageManager: PackageManager): {
  command: string;
  args: string[];
} {
  const resolved = resolveCommand(packageManager, "install", []);
  return {
    args: resolved?.args.filter(Boolean) ?? ["install"],
    command: resolved?.command ?? "npm",
  };
}
