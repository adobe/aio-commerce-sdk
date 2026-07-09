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

import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { hasDynamicSchema } from "@adobe/aio-commerce-lib-config";
import {
  getInstallCommand,
  getProjectInstallCommand,
} from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";
import * as prettier from "prettier";

import { parseCommerceAppConfig } from "#config/index";

import {
  APP_MANIFEST_FILE,
  CONFIG_SCHEMA_FILE_NAME,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  GENERATED_ACTIONS_PATH,
  GENERATED_PATH,
  getExtensionPointFolderPath,
  RUNTIME_APP_CONFIG_FILE,
} from "./constants";

import type {
  PackageInstallOptions,
  PackageManager,
} from "@aio-commerce-sdk/scripting-utils/project";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Format file content using prettier, inferring the parser from the file path. */
export function prettierFormat(content: string, filepath: string) {
  return prettier.format(content, {
    arrowParens: "always",
    bracketSameLine: true,
    bracketSpacing: true,
    filepath,
    printWidth: 80,
    quoteStyle: "double",
    semi: true,
    tabWidth: 2,
    trailingComma: "all",
    useTabs: false,
  });
}

/** Load the app commerce config */
export async function loadAppManifest() {
  // If the config file is invalid or missing, we want to fail early before generating any files
  const appConfig = await parseCommerceAppConfig();
  consola.debug("Loaded app commerce config");

  return appConfig;
}

/**
 * Install the given dependencies.
 * @param packageManager - The detected package manager.
 * @param dependencies - Package specifiers to install; no-op when empty.
 * @param cwd - Working directory for the install command.
 * @param options - Install command options.
 */
export function runInstall(
  packageManager: PackageManager,
  dependencies: string[],
  cwd = process.cwd(),
  options: PackageInstallOptions = {},
) {
  if (dependencies.length === 0) {
    return;
  }

  const dependencyListString = dependencies
    .map((dependency) => `  - ${dependency}`)
    .join("\n");

  consola.start(
    [
      `Installing the following dependencies with ${packageManager}:\n${dependencyListString}\n`,
      "This may take a few seconds...\n",
    ].join("\n"),
  );

  const { command, args } = getInstallCommand(
    packageManager,
    dependencies,
    options,
  );
  const displayCommand = [command, ...args].join(" ");
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `Failed to install dependencies automatically. Please install manually: ${displayCommand}`,
      {
        cause:
          result.error ??
          new Error(`Install exited with code ${result.status}`),
      },
    );
  }

  consola.log(""); // Add a newline after the install output for readability.
  consola.success("Dependencies installed successfully");
}

/**
 * Install dependencies declared in package.json.
 * @param packageManager - The detected package manager.
 * @param cwd - Working directory for the install command.
 */
export function runProjectInstall(
  packageManager: PackageManager,
  cwd = process.cwd(),
) {
  consola.start(
    [
      `Installing project dependencies with ${packageManager}...`,
      "This may take a few seconds...\n",
    ].join("\n"),
  );

  const { command, args } = getProjectInstallCommand(packageManager);
  const displayCommand = [command, ...args].join(" ");
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `Failed to install dependencies automatically. Please install manually: ${displayCommand}`,
      {
        cause:
          result.error ??
          new Error(`Install exited with code ${result.status}`),
      },
    );
  }

  consola.log(""); // Add a newline after the install output for readability.
  consola.success("Dependencies installed successfully");
}

/**
 * Whether the app config contains anything that can't be JSON-serialized as-is
 * and therefore requires generating a runtime-safe ESM config module.
 */
export function hasDynamicAppConfig(appConfig: CommerceAppConfigOutputModel) {
  const schema = appConfig.businessConfig?.schema;
  return Array.isArray(schema) && hasDynamicSchema(schema);
}

/**
 * Path to an extension point's `.generated` directory, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 */
export function getGeneratedDir(extensionPointId: string) {
  return join(getExtensionPointFolderPath(extensionPointId), GENERATED_PATH);
}

/**
 * Path to an extension point's generated actions directory, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 */
export function getActionsDir(extensionPointId: string) {
  return join(
    getExtensionPointFolderPath(extensionPointId),
    GENERATED_ACTIONS_PATH,
  );
}

/**
 * Path to a specific generated action file, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 * @param actionName - The name of the action, e.g. "my-action"
 */
export function getActionPath(extensionPointId: string, actionName: string) {
  return join(getActionsDir(extensionPointId), `${actionName}.js`);
}

/**
 * Path to an extension point's `ext.config.yaml`, relative to the project root.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1"
 */
export function getExtConfigPath(extensionPointId: string) {
  return join(getExtensionPointFolderPath(extensionPointId), "ext.config.yaml");
}

/** Path to the generated app manifest JSON file, relative to the project root. */
export function getManifestPath() {
  return join(
    getGeneratedDir(EXTENSIBILITY_EXTENSION_POINT_ID),
    APP_MANIFEST_FILE,
  );
}

/**
 * Path to the generated runtime-safe app config ESM module, relative to the
 * project root. Used when the business config schema contains dynamic options.
 */
export function getRuntimeAppConfigPath() {
  return join(
    getGeneratedDir(EXTENSIBILITY_EXTENSION_POINT_ID),
    RUNTIME_APP_CONFIG_FILE,
  );
}

/** Path to the generated configuration schema file, relative to the project root. */
export function getSchemaPath() {
  return join(
    getGeneratedDir(CONFIGURATION_EXTENSION_POINT_ID),
    CONFIG_SCHEMA_FILE_NAME,
  );
}
