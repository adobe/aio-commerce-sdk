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

import { readFile } from "node:fs/promises";
import { dirname } from "node:path";

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import { findNearestPackageJson } from "@aio-commerce-sdk/scripting-utils/project";
import { findUp } from "find-up";
import { createJiti } from "jiti";

import { validateConfig } from "./validate";

import type { ExtensibilityConfigOutputModel } from "#config/schema/extensibility";

const jiti = createJiti(import.meta.url);

/** The path to the bundled extensibility config file. */
const BUNDLED_EXTENSIBILITY_CONFIG_PATH =
  "app-management/extensibility.manifest.json";

// Config paths to search for. In order of likely appearance to speed up the check.
const configPaths = Object.freeze([
  "extensibility.config.js",
  "extensibility.config.ts",
  "extensibility.config.cjs",
  "extensibility.config.mjs",
  "extensibility.config.mts",
  "extensibility.config.cts",
]);

/**
 * Try to find (up to the nearest package.json file) the extensibility.config.js file.
 * @param cwd The current working directory
 */
export async function resolveExtensibilityConfig(cwd = process.cwd()) {
  const packageJsonPath = await findNearestPackageJson(cwd);

  if (!packageJsonPath) {
    return null;
  }

  const rootDirectory = dirname(packageJsonPath);

  for (const configPath of configPaths) {
    const configFilePath = await findUp(configPath, {
      cwd,
      stopAt: rootDirectory,
    });

    if (configFilePath) {
      return configFilePath;
    }
  }

  return null;
}

/**
 * Read the extensibility config file as-is, without validating it.
 * @param cwd The current working directory
 */
export async function readExtensibilityConfig(cwd = process.cwd()) {
  const configFilePath = await resolveExtensibilityConfig(cwd);

  if (!configFilePath) {
    throw new Error(
      "Could not find a extensibility config file in the current working directory or its parents.",
    );
  }

  type ImportedConfig = { default: unknown };
  let config: ImportedConfig | null = null;
  try {
    config = await jiti.import<ImportedConfig>(configFilePath);
  } catch (error) {
    throw new Error(
      `Failed to read extensibility config file at ${configFilePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (config && !("default" in config)) {
    throw new Error(
      "Extensibility config file does not export a default export. Make sure you use `export default` or `module.exports = { /* your config */ }`",
    );
  }

  return config.default;
}

/**
 * Read the extensibility config file and parses it's contents into it's schema.
 * @param configFilePath The path to the extensibility config file
 */
export async function parseExtensibilityConfig(cwd = process.cwd()) {
  const config = await readExtensibilityConfig(cwd);
  return validateConfig(config) satisfies ExtensibilityConfigOutputModel;
}

/**
 * Read the bundled extensibility config file
 *
 * @throws {Error} If the bundled extensibility config file is not found or if it is invalid
 */
export async function readBundledExtensibilityConfig() {
  try {
    const fileContents = await readFile(
      BUNDLED_EXTENSIBILITY_CONFIG_PATH,
      "utf-8",
    );

    return validateConfig(JSON.parse(fileContents));
  } catch (error) {
    const message = stringifyError(error);
    throw new Error(
      `Failed to read bundled extensibility config file: ${message}`,
      { cause: error },
    );
  }
}
