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

import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  appendCommand,
  detectPackageManager,
  getExecCommand,
  getProjectRootDirectory,
  loadPackageJson,
  readPackageJson,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";

import {
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  COMMERCE_APP_CONFIG_FILE,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  PACKAGE_JSON_FILE,
} from "#commands/constants";
import { run as generateActions } from "#commands/generate/actions/main";
import { run as generateManifest } from "#commands/generate/manifest/main";
import { run as generateSchema } from "#commands/generate/schema/main";
import { prettierFormat, runInstall } from "#commands/utils";
import {
  getConfigDomains,
  hasBackendUiV2Components,
  isTypeScriptConfig,
  parseCommerceAppConfig,
  readCommerceAppConfig,
  resolveCommerceAppConfig,
  validateCommerceAppConfig,
} from "#config/index";

import {
  addExtensionPointToAppConfig,
  addExtensionPointToInstallYaml,
  getDefaultCommerceAppConfig,
  initFlagsToScaffoldAppAnswers,
  promptForCommerceAppConfig,
} from "./utils";

import type { PackageManager } from "@aio-commerce-sdk/scripting-utils/project";
import type { PackageJson } from "type-fest";
import type { CommerceAppConfigDomain } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InitFlags } from "./main";

/**
 * Ensures a valid app configuration exists, creating one when requested.
 * @param projectRoot - Resolved project root containing the app configuration.
 * @param formatConfig - Whether to format a newly created configuration.
 * @param flags - Non-interactive answers; prompts are used when omitted.
 */
export async function ensureCommerceAppConfig(
  projectRoot: string,
  formatConfig = true,
  flags?: InitFlags,
) {
  const configFilePath = await resolveCommerceAppConfig(projectRoot);

  if (configFilePath !== null) {
    try {
      const config = await readCommerceAppConfig(projectRoot);
      const validatedConfig = validateCommerceAppConfig(config);
      consola.success(
        `${COMMERCE_APP_CONFIG_FILE} found and is valid. Continuing...`,
      );

      return {
        config: validatedConfig,
        configFormat: isTypeScriptConfig(configFilePath)
          ? ("ts" as const)
          : ("js" as const),
        domains: getConfigDomains(validatedConfig),
      };
    } catch (error) {
      throw new Error(`${COMMERCE_APP_CONFIG_FILE} is invalid`, {
        cause: error,
      });
    }
  }

  if (!flags) {
    consola.warn(`${COMMERCE_APP_CONFIG_FILE} not found.`);
    const createConfig = await consola.prompt(
      `Do you want to create a ${COMMERCE_APP_CONFIG_FILE} file? (y/n)`,
      {
        default: false,
        initial: true,
        type: "confirm",
      },
    );

    if (!createConfig) {
      throw new Error("Initialization cancelled.");
    }
  }

  const answers = flags
    ? initFlagsToScaffoldAppAnswers(flags)
    : await promptForCommerceAppConfig();

  try {
    const configContent = await getDefaultCommerceAppConfig(
      projectRoot,
      answers,
    );
    const path = join(projectRoot, answers.configFile);
    consola.info(`Creating ${answers.configFile}...`);

    if (formatConfig) {
      const formattedConfig = await prettierFormat(configContent, path);
      await writeFile(path, formattedConfig, "utf-8");
    } else {
      await writeFile(path, configContent, "utf-8");
    }

    const createdConfig = await parseCommerceAppConfig(projectRoot);
    consola.success(`Created ${answers.configFile}`);

    return {
      config: createdConfig,
      configFormat: answers.configFormat,
      domains: answers.domains,
    };
  } catch (error) {
    throw new Error(`Failed to create ${answers.configFile}`, {
      cause: error,
    });
  }
}

/**
 * Ensures package.json exists, then resolves the project root and package manager.
 * @param cwd - Directory in which to create or discover package.json.
 */
export async function ensurePackageJson(cwd = process.cwd()) {
  const existing = await readPackageJson(cwd);
  let packageJson: PackageJson;

  if (existing) {
    packageJson = existing;
  } else {
    consola.warn("package.json not found. Creating one...");
    packageJson = {
      name: "my-commerce-app",
      private: true,
      version: "1.0.0",
    };

    await writeFile(
      join(resolve(cwd), PACKAGE_JSON_FILE),
      JSON.stringify(packageJson, null, 2),
      "utf-8",
    );

    consola.success("Wrote package.json");
  }

  const projectRoot = await getProjectRootDirectory(cwd);
  const packageManager = await detectPackageManager(projectRoot);
  const execCommand = getExecCommand(packageManager);

  return {
    execCommand,
    packageJson,
    packageManager,
    projectRoot,
  };
}

/**
 * Registers the postinstall hook in package.json.
 * @param execCommand - Prefix for running local binaries, such as `pnpm exec`.
 * @param projectRoot - Resolved project root containing package.json.
 */
export async function writePostinstallHook(
  execCommand: string,
  projectRoot: string,
) {
  const postinstallScript = `${execCommand} aio-commerce-lib-app hooks postinstall`;
  const pkg = await loadPackageJson(projectRoot);
  if (pkg === null) {
    throw new Error("Could not find package.json.");
  }

  const existing = pkg.content.scripts?.postinstall;

  if (existing === postinstallScript || existing?.includes(postinstallScript)) {
    consola.success(
      `postinstall script already configured in ${PACKAGE_JSON_FILE}`,
    );

    return;
  }

  const nextPostinstall = appendCommand(existing, postinstallScript);

  if (existing) {
    consola.warn(
      `${PACKAGE_JSON_FILE} already has a postinstall script. Adding a new one...`,
    );
  } else {
    consola.info(`Adding postinstall script to ${PACKAGE_JSON_FILE}...`);
  }

  pkg.update({
    scripts: { ...pkg.content.scripts, postinstall: nextPostinstall },
  });

  await pkg.save();
  consola.success(`Added postinstall script to ${PACKAGE_JSON_FILE}`);
}

/**
 * Ensures app.config.yaml references the enabled domain extensions.
 * @param domains - Domains enabled in the app configuration.
 * @param config - The validated app configuration.
 * @param projectRoot - Resolved project root containing app.config.yaml.
 */
export async function ensureAppConfig(
  domains: Set<CommerceAppConfigDomain>,
  config: CommerceAppConfigOutputModel,
  projectRoot: string,
) {
  if (domains.has("businessConfig.schema")) {
    await addExtensionPointToAppConfig(
      CONFIGURATION_EXTENSION_POINT_ID,
      projectRoot,
      " This extension is required for business configuration. Do not remove.",
    );
  }

  if (hasBackendUiV2Components(config)) {
    await addExtensionPointToAppConfig(
      BACKEND_UI_V2_EXTENSION_POINT_ID,
      projectRoot,
      " This extension is required for Admin UI. Do not remove.",
    );
  }

  // This is always needed (to get the app config at least)
  await addExtensionPointToAppConfig(
    EXTENSIBILITY_EXTENSION_POINT_ID,
    projectRoot,
    " This extension is required for app management. Do not remove.",
  );
}

/**
 * Install the domain-specific dependencies derived from the selected domains.
 * @param packageManager - The detected package manager
 * @param domains - Domains enabled in the commerce app config
 * @param projectRoot - Resolved project root for the install command
 */
export function installDependencies(
  packageManager: PackageManager,
  domains: Set<CommerceAppConfigDomain>,
  projectRoot: string,
) {
  const packages: string[] = [];

  if (domains.has("businessConfig.schema")) {
    packages.push(`@adobe/aio-commerce-lib-config@${__LIB_CONFIG_RANGE__}`);
  }

  if (packages.length === 0) {
    consola.info("No additional domain dependencies to install.");
    return;
  }

  runInstall(packageManager, packages, projectRoot);
}

/**
 * Generates all project artifacts during initialization.
 * @param appConfig - Validated app configuration used for generation.
 * @param execCommand - Command prefix included in manual recovery guidance.
 * @param projectRoot - Resolved project root where artifacts are generated.
 */
export async function runGeneration(
  appConfig: CommerceAppConfigOutputModel,
  execCommand: string,
  projectRoot: string,
) {
  try {
    await generateActions(appConfig, projectRoot);
    await generateManifest(appConfig, projectRoot);
    await generateSchema(appConfig, projectRoot);
  } catch (error) {
    throw new Error(
      `Failed to run generation command. Please run manually: ${execCommand} aio-commerce-lib-app generate all`,
      {
        cause: error,
      },
    );
  }
}

/**
 * Ensures install.yaml references the enabled domain extensions.
 * @param domains - Domains enabled in the app configuration.
 * @param config - The validated app configuration.
 * @param projectRoot - Resolved project root containing install.yaml.
 */
export async function ensureInstallYaml(
  domains: Set<CommerceAppConfigDomain>,
  config: CommerceAppConfigOutputModel,
  projectRoot: string,
) {
  if (domains.has("businessConfig.schema")) {
    await addExtensionPointToInstallYaml(
      CONFIGURATION_EXTENSION_POINT_ID,
      projectRoot,
      " This extension is required for business configuration. Do not remove.",
    );
  }

  if (hasBackendUiV2Components(config)) {
    await addExtensionPointToInstallYaml(
      BACKEND_UI_V2_EXTENSION_POINT_ID,
      projectRoot,
      " This extension is required for Admin UI. Do not remove.",
    );
  }

  // This is always needed (to get the app config at least)
  await addExtensionPointToInstallYaml(
    EXTENSIBILITY_EXTENSION_POINT_ID,
    projectRoot,
    " This extension is required for app management. Do not remove.",
  );
}
