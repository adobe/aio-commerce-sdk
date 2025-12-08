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
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import util from "node:util";

import { readExtensibilityConfig } from "@adobe/aio-commerce-lib-extensibility/config";
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
import { isMap } from "yaml";

import {
  APP_CONFIG_FILE,
  ENV_FILE,
  EXTENSIBILITY_CONFIG_FILE,
  EXTENSION_POINT_FOLDER_PATH,
  EXTENSION_POINT_ID,
  INSTALL_YAML_FILE,
  PACKAGE_JSON_FILE,
} from "#commands/constants";
import { COMMERCE_VARIABLES } from "#commands/generate/actions/constants";

import {
  DEFAULT_EXTENSIBILITY_CONFIG_SCHEMA,
  ENV_VAR_REGEX,
} from "./constants";

import type { Document, YAMLSeq } from "yaml";
import type { PackageManager } from "./types";

/** Ensure extensibility.config.js exists, create it if it doesn't */
export async function ensureExtensibilityConfig(cwd = process.cwd()) {
  const extensibilityConfig = await readExtensibilityConfig(cwd);
  const { stdout, stderr } = process;

  if (extensibilityConfig) {
    stdout.write(
      `✅ ${EXTENSIBILITY_CONFIG_FILE} already exists. Continuing...\n`,
    );

    const schema = extensibilityConfig.businessConfig?.schema;
    if (!schema) {
      stderr.write(
        "⚠️ No schema found in extensibility.config.js. Please add a `businessConfig.schema` property.\n",
      );

      return false;
    }

    return true;
  }

  stdout.write(`\n📝 Creating ${EXTENSIBILITY_CONFIG_FILE}...\n`);
  const exportKeyword = (await isESM(cwd))
    ? "export default"
    : "module.exports =";

  const schema = util.inspect(DEFAULT_EXTENSIBILITY_CONFIG_SCHEMA, {
    depth: null,
    colors: false,
  });

  await writeFile(
    join(await getProjectRootDirectory(cwd), EXTENSIBILITY_CONFIG_FILE),
    `${exportKeyword} ${schema}\n`,
    "utf-8",
  );

  stdout.write(`✅ Created ${EXTENSIBILITY_CONFIG_FILE}\n`);
  return true;
}

/** Ensure package.json has the postinstall script */
export async function ensurePackageJsonScript(
  execCommand: string,
  cwd = process.cwd(),
) {
  const postinstallScript = `${execCommand} aio-commerce-lib-config generate all`;
  const packageJson = await readPackageJson(cwd);
  const { stdout, stderr } = process;

  if (!packageJson) {
    stderr.write(
      "⚠️  package.json not found. Please add the postinstall script manually:\n",
    );

    stdout.write(`   "postinstall": "${postinstallScript}"\n`);
    return false;
  }

  packageJson.scripts ??= {};

  if (
    packageJson.scripts.postinstall === postinstallScript ||
    packageJson.scripts.postinstall?.includes(postinstallScript)
  ) {
    stdout.write(
      `✅ postinstall script already configured in ${PACKAGE_JSON_FILE}\n`,
    );

    return true;
  }

  if (packageJson.scripts.postinstall) {
    stderr.write(
      `⚠️  ${PACKAGE_JSON_FILE} already has a postinstall script. Adding a new one...\n`,
    );

    packageJson.scripts.postinstall += ` && ${postinstallScript}`;
  } else {
    stdout.write(`📝 Adding postinstall script to ${PACKAGE_JSON_FILE}...\n`);
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

  stdout.write(`✅ Added postinstall script to ${PACKAGE_JSON_FILE}\n`);
  return true;
}

/** Ensure app.config.yaml has the extension reference */
export async function ensureAppConfig(cwd = process.cwd()) {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const appConfigPath = join(rootDirectory, APP_CONFIG_FILE);
  const includePath = join(EXTENSION_POINT_FOLDER_PATH, "ext.config.yaml");

  const { stdout, stderr } = process;
  let doc: Document;

  try {
    doc = await readYamlFile(appConfigPath);
  } catch (error) {
    const fallbackContent = `extensions:\n  ${EXTENSION_POINT_ID}:\n    $include: "${includePath}"`;

    stderr.write(`${stringifyError(error as Error)}\n`);
    stderr.write(
      `❌ Failed to parse ${APP_CONFIG_FILE}. \nPlease add manually: \n\n${fallbackContent}\n`,
    );

    return false;
  }

  if (
    doc.getIn(["extensions", EXTENSION_POINT_ID, "$include"]) === includePath
  ) {
    stdout.write(`✅ Extension already configured in ${APP_CONFIG_FILE}\n`);
    return true;
  }

  stdout.write(`\n📝 Adding extension to ${APP_CONFIG_FILE}...\n`);
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
  stdout.write(`✅ Updated ${APP_CONFIG_FILE}\n`);

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

/** Build SaaS environment variables section */
function buildSaaSEnvSection(
  existingEnvVars: Set<string>,
  saasVars: readonly string[],
): string {
  const missingSaaSVars = saasVars.filter((v) => !existingEnvVars.has(v));
  if (missingSaaSVars.length === 0) {
    return "";
  }

  let section = "# For SaaS instances:\n";
  section += "\n# IMS Authentication (SaaS)\n";

  for (const varName of missingSaaSVars) {
    if (varName !== "AIO_COMMERCE_API_BASE_URL") {
      section += `${varName}=your-${varName.toLowerCase().replace(/_/g, "-")}\n`;
    }
  }

  return `${section}\n`;
}

/** Build PaaS environment variables section */
function buildPaaSEnvSection(
  existingEnvVars: Set<string>,
  paasVars: readonly string[],
): string {
  const missingPaaSVars = paasVars.filter((v) => !existingEnvVars.has(v));
  if (missingPaaSVars.length === 0) {
    return "";
  }

  let section = "# For PaaS instances:\n";
  section += "# Integration Authentication (PaaS)\n";
  for (const varName of missingPaaSVars) {
    section += `${varName}=your-${varName.toLowerCase().replace(/_/g, "-")}\n`;
  }

  return `${section}\n`;
}

/** Ensure .env file has placeholder environment variables */
export async function ensureEnvFile(cwd = process.cwd()) {
  const envPath = join(await getProjectRootDirectory(cwd), ENV_FILE);
  const { stdout } = process;

  const envContent = existsSync(envPath)
    ? await readFile(envPath, "utf-8")
    : "";

  const existingEnvVars = extractEnvVars(envContent);
  const requiredVars = ["LOG_LEVEL", ...COMMERCE_VARIABLES];
  const missingVars = requiredVars.filter((v) => !existingEnvVars.has(v));

  if (missingVars.length === 0) {
    stdout.write(
      `\n✅ All required environment variables already present in ${ENV_FILE}\n`,
    );

    return true;
  }

  let newContent = "";
  stdout.write(
    `\n📝 Adding environment variable placeholders to ${ENV_FILE}...\n`,
  );

  if (!existingEnvVars.has("LOG_LEVEL")) {
    newContent += "# Logging level for runtime actions\n";
    newContent += "LOG_LEVEL=info\n\n";
  }

  newContent += "# Adobe Commerce API configuration\n";

  if (!existingEnvVars.has("AIO_COMMERCE_API_BASE_URL")) {
    newContent +=
      "AIO_COMMERCE_API_BASE_URL=https://your-commerce-instance.com\n\n";
  }

  newContent += buildSaaSEnvSection(existingEnvVars, [
    "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
    "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
    "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
    "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
    "AIO_COMMERCE_AUTH_IMS_ORG_ID",
    "AIO_COMMERCE_AUTH_IMS_SCOPES",
  ]);

  newContent += buildPaaSEnvSection(existingEnvVars, [
    "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY",
    "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET",
    "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN",
    "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET",
  ]);

  await writeFile(envPath, `${newContent}\n${envContent}`, "utf-8");
  stdout.write(`✅ Added environment variable placeholders to ${ENV_FILE}\n`);

  return true;
}

/** Install required dependencies */
export function installDependencies(
  packageManager: PackageManager,
  cwd = process.cwd(),
) {
  const { stdout, stderr } = process;
  stdout.write(`\n📦 Installing dependencies with ${packageManager}...\n`);

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

    stdout.write("\n✅ Dependencies installed successfully\n");
    return true;
  } catch (error) {
    stderr.write(`${stringifyError(error as Error)}\n`);
    stderr.write(
      `\n❌  Failed to install dependencies automatically. Please install manually: ${installCommand}\n`,
    );

    return false;
  }
}

/** Run the generation command */
export async function runGeneration(cwd = process.cwd()) {
  const packageManager = await detectPackageManager(cwd);
  const execCommand = getExecCommand(packageManager);
  const { stderr } = process;

  try {
    // Although we programatically add the postinstall script to package.json, we still need to run the generation
    // command manually because many package managers block postinstall scripts by default
    execSync(`${execCommand} aio-commerce-lib-config generate all`, {
      cwd,
      stdio: "inherit",
    });
  } catch (error) {
    stderr.write(`${stringifyError(error as Error)}\n`);
    stderr.write(
      `❌  Failed to run generation command. Please run manually: ${execCommand} aio-commerce-lib-config generate all\n`,
    );

    return false;
  }

  return true;
}

/** Ensure install.yaml has the extension reference */
export async function ensureInstallYaml(cwd = process.cwd()) {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const installYamlPath = join(rootDirectory, INSTALL_YAML_FILE);
  const { stdout, stderr } = process;

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
    stderr.write(
      `\n❌ Something went wrong while preparing "${INSTALL_YAML_FILE}": ${error}\n`,
    );

    stderr.write(`Please add manually: \n${fallbackContent}\n\n`);
    return false;
  }

  // Check if the extension is already configured
  if (
    extensions.items.some(
      (item) =>
        isMap(item) && item.get("extensionPointId") === EXTENSION_POINT_ID,
    )
  ) {
    stdout.write(`✅ Extension already configured in ${INSTALL_YAML_FILE}\n`);
    return true;
  }

  stdout.write(`\n📝 Adding extension to ${INSTALL_YAML_FILE}...\n`);
  const extension = doc.createPair("extensionPointId", EXTENSION_POINT_ID);
  extension.key.commentBefore = ` \`${EXTENSION_POINT_ID}\` is required by \`@adobe/aio-commerce-lib-config\`.`;
  extensions.items.unshift(extension);

  await writeFile(installYamlPath, doc.toString(), "utf-8");
  stdout.write(`✅ Updated ${INSTALL_YAML_FILE}\n`);

  return true;
}
