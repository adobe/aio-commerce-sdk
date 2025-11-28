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

import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { findUp } from "find-up";
import { createJiti } from "jiti";

import { EXTENSIBILITY_CONFIG_FILE } from "#commands/constants";

import type { PackageJson } from "type-fest";
import type { ExtensibilityConfig } from "#modules/schema/types";

const jiti = createJiti(import.meta.url);

/**
 * Find the nearest package.json file in the current working directory or its parents
 * @param cwd The current working directory
 * @param logger - The logger to use
 */
export async function findNearestPackageJson(cwd = process.cwd()) {
  const packageJsonPath = await findUp("package.json", { cwd });

  if (!packageJsonPath) {
    return null;
  }

  return packageJsonPath;
}

/** Read the package.json file */
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
    return false;
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
 * Create the output directory for the generated files
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

/**
 * Try to find (up to the nearest package.json file) the extensibility.config.js file.
 * @param cwd The current working directory
 */
export async function readExtensibilityConfig(cwd = process.cwd()) {
  const packageJsonPath = await findNearestPackageJson(cwd);

  if (!packageJsonPath) {
    return null;
  }

  const configPath = await findUp(EXTENSIBILITY_CONFIG_FILE, {
    cwd,
    stopAt: await getProjectRootDirectory(cwd),
  });

  if (!configPath) {
    return null;
  }

  return await jiti.import<ExtensibilityConfig>(configPath);
}

/**
 * Stringify an error to a human-friendly string.
 * @param error - The error to stringify.
 */
export function stringifyError(error: Error) {
  if (error instanceof CommerceSdkValidationError) {
    return error.display();
  }

  return error instanceof Error ? error.message : "Unknown error";
}
