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

import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  getProjectRootDirectory,
  readPackageJson,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";
import * as prettier from "prettier";

import {
  COMMERCE_APP_CONFIG_FILE,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  PACKAGE_JSON_FILE,
} from "#commands/constants";
import { run as generateActionsCommand } from "#commands/generate/actions/main";
import { run as generateManifestCommand } from "#commands/generate/manifest/main";
import {
  getConfigDomains,
  parseCommerceAppConfig,
  readCommerceAppConfig,
  validateCommerceAppConfig,
} from "#config/index";

import {
  addExtensionPointToAppConfig,
  addExtensionPointToInstallYaml,
  getDefaultCommerceAppConfig,
  promptForCommerceAppConfig,
} from "./utils";

import type { PackageManager } from "@aio-commerce-sdk/scripting-utils/project";
import type { PackageJson } from "type-fest";
import type { CommerceAppConfigDomain } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Ensure app.commerce.config file exists, allow creating if it doesn't */
export async function ensureCommerceAppConfig(cwd = process.cwd()) {
  let config: unknown | null = null;
  try {
    config = await readCommerceAppConfig(cwd);
  } catch (_) {
    // Ignore if not found.
  }

  if (config) {
    try {
      const validatedConfig = validateCommerceAppConfig(config);
      consola.success(
        `${COMMERCE_APP_CONFIG_FILE} found and is valid. Continuing...`,
      );

      return {
        config: validatedConfig,
        domains: getConfigDomains(validatedConfig),
      };
    } catch (error) {
      throw new Error(`${COMMERCE_APP_CONFIG_FILE} is invalid`, {
        cause: error,
      });
    }
  }

  consola.warn(`${COMMERCE_APP_CONFIG_FILE} not found.`);
  const createConfig = await consola.prompt(
    `Do you want to create a ${COMMERCE_APP_CONFIG_FILE} file? (y/n)`,
    {
      type: "confirm",
      initial: true,
      default: false,
    },
  );

  if (!createConfig) {
    throw new Error("Initialization cancelled.");
  }

  const answers = await promptForCommerceAppConfig();
  try {
    const configContent = await getDefaultCommerceAppConfig(cwd, answers);
    consola.info(`Creating ${answers.configFile}...`);

    const path = join(await getProjectRootDirectory(cwd), answers.configFile);
    const formattedConfig = await prettier.format(configContent, {
      semi: true,
      quoteStyle: "double",
      arrowParens: "always",
      bracketSameLine: true,
      bracketSpacing: true,
      trailingComma: "all",
      tabWidth: 2,
      useTabs: false,
      printWidth: 80,
      filepath: path,
    });

    await writeFile(path, formattedConfig, "utf-8");
    consola.success(`Created ${answers.configFile}`);

    const config = await parseCommerceAppConfig(cwd);
    return { config, domains: answers.domains };
  } catch (error) {
    throw new Error(`Failed to create ${answers.configFile}`, {
      cause: error,
    });
  }
}

/** Ensure package.json has the postinstall script */
export async function ensurePackageJson(
  execCommand: string,
  cwd = process.cwd(),
) {
  const postinstallScript = `${execCommand} aio-commerce-lib-app generate all`;
  const packageJson = await readPackageJson(cwd);

  if (!packageJson) {
    consola.warn("package.json not found. Creating one...");
    const packageJsonContent: PackageJson = {
      name: "my-commerce-app",
      version: "1.0.0",
      private: true,

      scripts: {
        postinstall: postinstallScript,
      },
    };

    await writeFile(
      join(resolve(cwd), PACKAGE_JSON_FILE),
      JSON.stringify(packageJsonContent, null, 2),
      "utf-8",
    );

    consola.success("Wrote package.json");
    return packageJsonContent;
  }

  packageJson.scripts ??= {};

  if (
    packageJson.scripts.postinstall === postinstallScript ||
    packageJson.scripts.postinstall?.includes(postinstallScript)
  ) {
    consola.success(
      `postinstall script already configured in ${PACKAGE_JSON_FILE}`,
    );

    return packageJson;
  }

  if (packageJson.scripts.postinstall) {
    consola.warn(
      `${PACKAGE_JSON_FILE} already has a postinstall script. Adding a new one...`,
    );

    packageJson.scripts.postinstall += ` && ${postinstallScript}`;
  } else {
    consola.info(`Adding postinstall script to ${PACKAGE_JSON_FILE}...`);
    packageJson.scripts = {
      postinstall: postinstallScript,
      ...packageJson.scripts,
    };
  }

  await writeFile(
    join(await getProjectRootDirectory(cwd), PACKAGE_JSON_FILE),
    JSON.stringify(packageJson, null, 2),
    "utf-8",
  );

  consola.success(`Added postinstall script to ${PACKAGE_JSON_FILE}`);
  return packageJson;
}

/** Ensure app.config.yaml has the extension reference */
export async function ensureAppConfig(
  domains: Set<CommerceAppConfigDomain>,
  cwd = process.cwd(),
) {
  const rootDirectory = await getProjectRootDirectory(cwd);

  if (domains.has("businessConfig.schema")) {
    await addExtensionPointToAppConfig(
      CONFIGURATION_EXTENSION_POINT_ID,
      rootDirectory,
      " This extension is required for business configuration. Do not remove.",
    );
  }

  // This is always needed (to get the app config at least)
  await addExtensionPointToAppConfig(
    EXTENSIBILITY_EXTENSION_POINT_ID,
    rootDirectory,
    " This extension is required for app management. Do not remove.",
  );
}

/** Install required dependencies */
export function installDependencies(
  packageManager: PackageManager,
  domains: Set<CommerceAppConfigDomain>,
  cwd = process.cwd(),
) {
  consola.info(`Installing dependencies with ${packageManager}...`);
  const packages: string[] = [
    "@adobe/aio-commerce-lib-app",
    "@adobe/aio-commerce-sdk",
  ];

  if (domains.has("businessConfig.schema")) {
    packages.push("@adobe/aio-commerce-lib-config");
  }

  const packagesToInstall = packages.join(" ");
  const installCommandMap = {
    pnpm: `pnpm add ${packagesToInstall}`,
    yarn: `yarn add ${packagesToInstall}`,
    bun: `bun add ${packagesToInstall}`,
    npm: `npm install ${packagesToInstall}`,
  } as const;

  const installCommand = installCommandMap[packageManager];
  try {
    execSync(installCommand, {
      cwd,
      stdio: "inherit",
    });

    consola.success("Dependencies installed successfully");
  } catch (error) {
    throw new Error(
      `Failed to install dependencies automatically. Please install manually: ${installCommand}`,
      {
        cause: error,
      },
    );
  }
}

/** Run the generation command */
export async function runGeneration(
  appConfig: CommerceAppConfigOutputModel,
  execCommand: string,
) {
  try {
    await generateActionsCommand(appConfig);
    await generateManifestCommand(appConfig);
  } catch (error) {
    throw new Error(
      `Failed to run generation command. Please run manually: ${execCommand} aio-commerce-lib-app generate all`,
      {
        cause: error,
      },
    );
  }
}

/** Ensure install.yaml has the extension reference */
export async function ensureInstallYaml(
  domains: Set<CommerceAppConfigDomain>,
  cwd = process.cwd(),
) {
  const rootDirectory = await getProjectRootDirectory(cwd);

  if (domains.has("businessConfig.schema")) {
    await addExtensionPointToInstallYaml(
      CONFIGURATION_EXTENSION_POINT_ID,
      rootDirectory,
      " This extension is required for business configuration. Do not remove.",
    );
  }

  // This is always needed (to get the app config at least)
  await addExtensionPointToInstallYaml(
    EXTENSIBILITY_EXTENSION_POINT_ID,
    rootDirectory,
    " This extension is required for app management. Do not remove.",
  );
}
