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

import { join } from "node:path";
import { inspect } from "node:util";

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { stringify } from "yaml";

import {
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
  PACKAGE_NAME,
} from "#commands/constants";
import { runGeneration } from "#commands/init/lib";
import { getActionPath, getManifestPath, getSchemaPath } from "#commands/utils";

import { makeTemplateFiles } from "./commands";
import { configWithBusinessConfig, minimalValidConfig } from "./config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** The minimum set of files needed for our commands to work (no config file). */
export const EMPTY_PROJECT = makeProjectFiles(null);

/** The minimum set of files needed for our commands to work with a valid config. */
export const MINIMAL_PROJECT = makeProjectFiles(minimalValidConfig);

/** Project with business configuration schema for testing full generation flows. */
export const BUSINESS_CONFIG_PROJECT = makeProjectFiles(
  configWithBusinessConfig,
);

/** The minimum set of files needed for our commands to work with an invalid config. */
export const INVALID_PROJECT = makeProjectFiles({
  // @ts-expect-error - On purpose, reusable invalid config for testing.
  metadata: { id: "invalid" },
});

/**
 * Creates temp file entries for a project with a config file.
 *
 * @param config - The config to serialize into the config file.
 * @param format - The format of the config file, either CommonJS or ESM. Defaults to CommonJS.
 * @param extras - Any additional files to include in the project, as a record of file paths to contents.
 */
export function makeProjectFiles(
  config: CommerceAppConfigOutputModel | null = null,
  format: "cjs" | "esm" = "esm",
  projectExtras: Record<string, string> = {},
): Record<string, string> {
  const type = format === "esm" ? "module" : "commonjs";
  const packageJson = JSON.stringify({ type });

  if (!config) {
    return {
      "package.json": packageJson,
      ...projectExtras,
    };
  }

  const serialized = inspect(config, { depth: null });
  const fileName =
    format === "esm" ? "app.commerce.config.ts" : "app.commerce.config.js";

  const content =
    format === "esm"
      ? `export default ${serialized}`
      : `module.exports = ${serialized}`;

  return {
    "package.json": packageJson,
    [fileName]: content,
    ...projectExtras,
  };
}

/**
 * Create a string representation of environment variables for use in .env files.
 * @param env The variables to serialize, as a record of variable names to values.
 */
export function envObject(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

/**
 * Creates an entry for an extension point ext.config.yaml with the given actions.
 * @param extensionPointId The extension point ID to create the config for.
 * @param actionNames The names of the actions to include in the config.
 */
export function makeExtConfigFile(
  extensionPointId: string,
  actionNames: string[],
  packageName = PACKAGE_NAME,
) {
  const extConfig = {
    runtimeManifest: {
      packages: {
        [packageName]: {
          actions: Object.fromEntries(
            actionNames.map((actionName) => [actionName, {}]),
          ),
        },
      },
    },
  };

  return {
    [join(getExtensionPointFolderPath(extensionPointId), "ext.config.yaml")]:
      stringify(extConfig),
  };
}

/** Absolute path to a generated extensibility action file inside a temp project. */
export function extensibilityActionFile(tempDir: string, actionName: string) {
  return join(
    tempDir,
    getActionPath(EXTENSIBILITY_EXTENSION_POINT_ID, actionName),
  );
}

/** Absolute path to a generated business configuration action file inside a temp project. */
export function businessConfigActionFile(tempDir: string, actionName: string) {
  return join(
    tempDir,
    getActionPath(CONFIGURATION_EXTENSION_POINT_ID, actionName),
  );
}

/** Absolute path to the generated app manifest file inside a temp project. */
export function generatedManifestFile(tempDir: string) {
  return join(tempDir, getManifestPath());
}

/** Absolute path to the generated configuration schema file inside a temp project. */
export function generatedSchemaFile(tempDir: string) {
  return join(tempDir, getSchemaPath());
}

/**
 * Scaffolds a temp project with the given files and runs the callback with
 * the tempDir as the current working directory.
 */
export async function withTempProject(
  files: Record<string, string>,
  callback: (tempDir: string) => void | Promise<void>,
) {
  await withTempFiles(files, async (tempDir) => {
    await withChdir(tempDir, () => callback(tempDir));
  });
}

/**
 * Scaffolds an EMPTY_PROJECT with action templates, chdir's into it, runs
 * `runGeneration`, then yields the tempDir path to the caller for assertions.
 */
export async function withGeneratedProject(
  config: CommerceAppConfigOutputModel,
  assertions: (tempDir: string) => void | Promise<void>,
) {
  await withTempProject(
    { ...EMPTY_PROJECT, ...makeTemplateFiles() },
    async (tempDir) => {
      await runGeneration(config, "npx");
      await assertions(tempDir);
    },
  );
}
