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

import { dirname } from "node:path";

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import {
  findNearestPackageJson,
  findUp,
} from "@aio-commerce-sdk/scripting-utils/project";
import { createJiti } from "jiti";

import { validateCommerceAppConfig } from "./validate";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const jiti = createJiti(import.meta.url);

// Config paths to search for. In order of likely appearance to speed up the check.
const configPaths = Object.freeze([
  "app.commerce.config.js",
  "app.commerce.config.ts",
  "app.commerce.config.cjs",
  "app.commerce.config.mjs",
  "app.commerce.config.mts",
  "app.commerce.config.cts",
]);

/**
 * Try to find (up to the nearest package.json file) the app config file.
 *
 * Searches for config files in the following order of priority:
 * 1. `app.commerce.config.js` - JavaScript (CommonJS or ESM)
 * 2. `app.commerce.config.ts` - TypeScript
 * 3. `app.commerce.config.cjs` - CommonJS
 * 4. `app.commerce.config.mjs` - ES Module
 * 5. `app.commerce.config.mts` - ES Module TypeScript
 * 6. `app.commerce.config.cts` - CommonJS TypeScript
 *
 * @param cwd The current working directory
 * @returns The path to the config file, or null if not found
 */
export async function resolveCommerceAppConfig(cwd = process.cwd()) {
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
 * Read the commerce app config file as-is, without validating it.
 *
 * Supports multiple config file formats (see {@link resolveCommerceAppConfig} for the list).
 * The config file must export a default export with the configuration object.
 *
 * @param cwd The current working directory
 * @returns The raw config object from the file
 * @throws {Error} If no config file is found or if the file doesn't export a default export
 */
export async function readCommerceAppConfig(
  cwd = process.cwd(),
): Promise<unknown> {
  const configFilePath = await resolveCommerceAppConfig(cwd);

  if (!configFilePath) {
    throw new Error(
      "Could not find a commerce app config file in the current working directory or its parents.",
    );
  }

  type ImportedConfig = { default: unknown };
  let config: ImportedConfig | null = null;
  try {
    config = await jiti.import<ImportedConfig>(configFilePath);
  } catch (error) {
    const message = stringifyError(error);
    throw new Error(
      `Failed to read commerce app config file at ${configFilePath}: ${message}`,
      {
        cause: error,
      },
    );
  }

  if (
    !(config && "default" in config) ||
    config.default === undefined ||
    config.default === null ||
    (typeof config.default === "object" &&
      Object.keys(config.default).length === 0)
  ) {
    throw new Error(
      "Commerce app config file does not export a default export. Make sure you use `export default` or `module.exports = { /* your config */ }`",
    );
  }

  return config.default;
}

/**
 * Read the commerce app config file and parse its contents into its schema.
 *
 * Supports multiple config file formats (see {@link resolveCommerceAppConfig} for the list).
 * The config file must export a default export with the configuration object.
 *
 * @param cwd The current working directory
 * @returns The validated and parsed config object
 * @throws {Error} If no config file is found, if the file doesn't export a default export, or if validation fails
 */
export async function parseCommerceAppConfig(cwd = process.cwd()) {
  const config = await readCommerceAppConfig(cwd);
  return validateCommerceAppConfig(
    config,
  ) satisfies CommerceAppConfigOutputModel;
}
