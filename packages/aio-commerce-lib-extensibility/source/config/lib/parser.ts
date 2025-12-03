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

import { findNearestPackageJson } from "@aio-commerce-sdk/scripting-utils/fs";
import { findUp } from "find-up";
import { createJiti } from "jiti";

import { validateConfig } from "./validate";

import type { ExtensibilityConfigOutputModel } from "../schema";

const jiti = createJiti(import.meta.url);

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
 * Read the extensibility config file
 * @param configFilePath The path to the extensibility config file
 */
export async function readExtensibilityConfig(cwd = process.cwd()) {
  const configFilePath = await resolveExtensibilityConfig(cwd);

  if (!configFilePath) {
    throw new Error(
      "Could not find a extensibility config file in the current working directory or its parents.",
    );
  }

  let config: ExtensibilityConfigOutputModel | null = null;
  try {
    config = await jiti.import<ExtensibilityConfigOutputModel>(configFilePath);
  } catch (error) {
    throw new Error(
      `Failed to read extensibility config file at ${configFilePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return validateConfig(config);
}
