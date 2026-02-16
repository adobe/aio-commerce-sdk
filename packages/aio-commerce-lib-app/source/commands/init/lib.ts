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
import { join } from "node:path";
import util from "node:util";

import { readCommerceAppConfig } from "@adobe/aio-commerce-lib-app/config";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import {
  detectPackageManager,
  getExecCommand,
  getProjectRootDirectory,
  isESM,
  readPackageJson,
} from "@aio-commerce-sdk/scripting-utils/project";
import {
  getOrCreateMap,
  getOrCreateSeq,
  readYamlFile,
} from "@aio-commerce-sdk/scripting-utils/yaml";
import { consola } from "consola";
import { isMap } from "yaml";

import {
  APP_CONFIG_FILE,
  COMMERCE_APP_CONFIG_FILE,
  EXTENSION_POINT_FOLDER_PATH,
  EXTENSION_POINT_ID,
  INSTALL_YAML_FILE,
  PACKAGE_JSON_FILE,
} from "#commands/constants";

import { DEFAULT_COMERCE_APP_CONFIG, ENV_VAR_REGEX } from "./constants";

import type { CommerceAppConfig } from "@adobe/aio-commerce-lib-app/config";
import type { PackageManager } from "@aio-commerce-sdk/scripting-utils/project";
import type { Document, YAMLSeq } from "yaml";

/** Ensure app.commerce.config.js exists, create it if it doesn't */
export async function ensureCommerceAppConfig(cwd = process.cwd()) {
  let commerceAppConfig: unknown = null;
  try {
    commerceAppConfig = await readCommerceAppConfig(cwd);
  } catch (_) {
    // Do nothing
  }

  if (commerceAppConfig) {
    const typedConfig = commerceAppConfig as CommerceAppConfig;
    const schema = typedConfig.businessConfig?.schema;
    if (!schema) {
      consola.warn(
        "No schema found in app.commerce.config. Please add a `businessConfig.schema` property.",
      );

      return false;
    }

    consola.success(
      `${COMMERCE_APP_CONFIG_FILE} already exists. Continuing...`,
    );

    return true;
  }

  consola.info(`Creating ${COMMERCE_APP_CONFIG_FILE}.ts...`);
  const isEcmaScript = await isESM(cwd);
  const exportKeyword = isEcmaScript ? "export default" : "module.exports =";

  const schema = util.inspect(DEFAULT_COMERCE_APP_CONFIG, {
    depth: null,
    colors: false,
  });

  const importStatement = isEcmaScript
    ? "import { defineConfig } from '@adobe/aio-commerce-lib-app/config';\n"
    : "const { defineConfig } = require('@adobe/aio-commerce-lib-app/config');\n";

  await writeFile(
    join(await getProjectRootDirectory(cwd), `${COMMERCE_APP_CONFIG_FILE}.js`),
    `${importStatement}\n${exportKeyword} defineConfig(${schema})\n`,
    "utf-8",
  );

  consola.success(`Created ${COMMERCE_APP_CONFIG_FILE}.js`);
  return true;
}

/** Ensure package.json has the postinstall script */
export async function ensurePackageJsonScript(
  execCommand: string,
  cwd = process.cwd(),
) {
  const postinstallScript = `${execCommand} aio-commerce-lib-config generate all`;
  const packageJson = await readPackageJson(cwd);

  if (!packageJson) {
    consola.warn(
      "package.json not found. Please add the postinstall script manually:",
    );

    consola.log.raw(`   "postinstall": "${postinstallScript}"`);
    return false;
  }

  packageJson.scripts ??= {};

  if (
    packageJson.scripts.postinstall === postinstallScript ||
    packageJson.scripts.postinstall?.includes(postinstallScript)
  ) {
    consola.success(
      `postinstall script already configured in ${PACKAGE_JSON_FILE}`,
    );

    return true;
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
  return true;
}

/** Ensure app.config.yaml has the extension reference */
export async function ensureAppConfig(cwd = process.cwd()) {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const appConfigPath = join(rootDirectory, APP_CONFIG_FILE);
  const includePath = join(EXTENSION_POINT_FOLDER_PATH, "ext.config.yaml");

  let doc: Document;

  try {
    doc = await readYamlFile(appConfigPath);
  } catch (error) {
    const fallbackContent = `extensions:\n  ${EXTENSION_POINT_ID}:\n    $include: "${includePath}"`;

    consola.error(stringifyError(error as Error));
    consola.log.raw(
      `Failed to parse ${APP_CONFIG_FILE}. \nPlease add manually: \n\n${fallbackContent}`,
    );

    return false;
  }

  if (
    doc.getIn(["extensions", EXTENSION_POINT_ID, "$include"]) === includePath
  ) {
    consola.success(`Extension already configured in ${APP_CONFIG_FILE}`);
    return true;
  }

  consola.info(`Adding extension to ${APP_CONFIG_FILE}...`);
  const extensions = getOrCreateMap(doc, ["extensions"], {
    onBeforeCreate: (pair) => {
      pair.key.spaceBefore = true;
    },
  });

  const commerceConfigExtension = getOrCreateMap(
    doc,
    ["extensions", EXTENSION_POINT_ID],
    {
      onBeforeCreate: (pair) => {
        pair.key.spaceBefore = extensions.items.length > 0;
        pair.key.commentBefore =
          " This extension is required by `@adobe/aio-commerce-lib-config`.";
      },
    },
  );

  commerceConfigExtension.set("$include", includePath);

  await writeFile(appConfigPath, doc.toString(), "utf-8");
  consola.success(`Updated ${APP_CONFIG_FILE}`);

  return true;
}

/** Extract existing environment variable names from .env content */
export function extractEnvVars(envContent: string): Set<string> {
  const existingEnvVars = new Set<string>();
  const lines = envContent.split("\n");

  for (const line of lines) {
    const match = line.match(ENV_VAR_REGEX);
    if (match) {
      existingEnvVars.add(match[1]);
    }
  }

  return existingEnvVars;
}

/** Install required dependencies */
export function installDependencies(
  packageManager: PackageManager,
  cwd = process.cwd(),
) {
  consola.info(`Installing dependencies with ${packageManager}...`);

  const packages = [
    "@adobe/aio-commerce-lib-config",
    "@adobe/aio-commerce-sdk",
  ];

  const installCommandMap = {
    pnpm: `pnpm add ${packages.join(" ")}`,
    yarn: `yarn add ${packages.join(" ")}`,
    bun: `bun add ${packages.join(" ")}`,
    npm: `npm install ${packages.join(" ")}`,
  } as const;

  const installCommand = installCommandMap[packageManager];
  try {
    execSync(installCommand, {
      cwd,
      stdio: "inherit",
    });

    consola.success("Dependencies installed successfully");
    return true;
  } catch (error) {
    consola.error(stringifyError(error as Error));
    consola.log.raw(
      `Failed to install dependencies automatically. Please install manually: ${installCommand}`,
    );

    return false;
  }
}

/** Run the generation command */
export async function runGeneration(cwd = process.cwd()) {
  const packageManager = await detectPackageManager(cwd);
  const execCommand = getExecCommand(packageManager);

  try {
    // Although we programatically add the postinstall script to package.json, we still need to run the generation
    // command manually because many package managers block postinstall scripts by default
    execSync(`${execCommand} aio-commerce-lib-config generate all`, {
      cwd,
      stdio: "inherit",
    });
  } catch (error) {
    consola.error(stringifyError(error as Error));
    consola.log.raw(
      `Failed to run generation command. Please run manually: ${execCommand} aio-commerce-lib-config generate all`,
    );

    return false;
  }

  return true;
}

/** Ensure install.yaml has the extension reference */
export async function ensureInstallYaml(cwd = process.cwd()) {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const installYamlPath = join(rootDirectory, INSTALL_YAML_FILE);

  let doc: Document;
  let extensions: YAMLSeq;

  try {
    doc = await readYamlFile(installYamlPath);
    extensions = getOrCreateSeq(doc, ["extensions"], {
      onBeforeCreate: (pair) => {
        pair.key.spaceBefore = true;
      },
    });
  } catch (error) {
    const fallbackContent = `\nextensions:\n  - extensionPointId: ${EXTENSION_POINT_ID}`;
    consola.error(
      `Something went wrong while preparing "${INSTALL_YAML_FILE}": ${error}`,
    );

    consola.log.raw(`Please add manually: \n${fallbackContent}\n`);
    return false;
  }

  // Check if the extension is already configured
  if (
    extensions.items.some(
      (item) =>
        isMap(item) && item.get("extensionPointId") === EXTENSION_POINT_ID,
    )
  ) {
    consola.success(`Extension already configured in ${INSTALL_YAML_FILE}`);
    return true;
  }

  consola.info(`Adding extension to ${INSTALL_YAML_FILE}...`);
  const extension = doc.createPair("extensionPointId", EXTENSION_POINT_ID);
  extension.key.commentBefore = ` \`${EXTENSION_POINT_ID}\` is required by \`@adobe/aio-commerce-lib-config\`.`;
  extensions.items.unshift(extension);

  await writeFile(installYamlPath, doc.toString(), "utf-8");
  consola.success(`Updated ${INSTALL_YAML_FILE}`);

  return true;
}
