import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import util from "node:util";

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

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
  getProjectRootDirectory,
  isESM,
  readExtensibilityConfig,
  readPackageJson,
  stringifyError,
} from "#commands/utils";

import {
  DEFAULT_EXTENSIBILITY_CONFIG_SCHEMA,
  ENV_VAR_REGEX,
} from "./constants";
import { logger } from "./logger";

import type { AppConfig, InstallYaml, PackageManager } from "./types";

/** Ensure extensibility.config.js exists, create it if it doesn't */
export async function ensureExtensibilityConfig(cwd = process.cwd()) {
  const extensibilityConfig = await readExtensibilityConfig(cwd);

  if (extensibilityConfig) {
    logger.info(
      `✅ ${EXTENSIBILITY_CONFIG_FILE} already exists. Continuing...`,
    );

    const schema = extensibilityConfig.businessConfig?.schema;
    if (!schema) {
      logger.warn(
        "⚠️ No schema found in extensibility.config.js. Please add a `businessConfig.schema` property.",
      );

      return false;
    }

    return true;
  }

  logger.info(`📝 Creating ${EXTENSIBILITY_CONFIG_FILE}...`);
  const exportKeyword = (await isESM(cwd))
    ? "export default"
    : "module.exports =";

  const schema = util.inspect(DEFAULT_EXTENSIBILITY_CONFIG_SCHEMA, {
    depth: null,
    colors: false,
  });

  const defaultExtensibilityConfig = `${exportKeyword} {\n\tbusinessConfig: {\n\t\tschema: ${schema},\n\t},\n}`;
  await writeFile(
    join(await getProjectRootDirectory(cwd), EXTENSIBILITY_CONFIG_FILE),
    defaultExtensibilityConfig,
    "utf-8",
  );

  logger.info(`✅ Created ${EXTENSIBILITY_CONFIG_FILE}`);
  return true;
}

/** Detect the package manager by checking for lock files */
export async function detectPackageManager(
  cwd = process.cwd(),
): Promise<PackageManager> {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const lockFileMap = {
    "bun.lockb": "bun",
    "pnpm-lock.yaml": "pnpm",
    "yarn.lock": "yarn",
    "package-lock.json": "npm",
  } as const;

  const lockFileName = Object.keys(lockFileMap).find((name) =>
    existsSync(join(rootDirectory, name)),
  ) as keyof typeof lockFileMap;

  if (!lockFileName) {
    return "npm";
  }

  return lockFileMap[lockFileName];
}

/** Get the appropriate exec command based on package manager */
export function getExecCommand(packageManager: PackageManager): string {
  const execCommandMap = {
    pnpm: "pnpx",
    yarn: "yarn dlx",
    bun: "bunx",
    npm: "npx",
  } as const;

  return execCommandMap[packageManager];
}

/** Ensure package.json has the postinstall script */
export async function ensurePackageJsonScript(
  execCommand: string,
  cwd = process.cwd(),
) {
  const postinstallScript = `${execCommand} @adobe/aio-commerce-lib-config generate all`;
  const packageJson = await readPackageJson(cwd);

  if (!packageJson) {
    logger.warn(
      "⚠️  package.json not found. Please add the postinstall script manually:",
    );

    logger.info(`   "postinstall": "${postinstallScript}"`);
    return false;
  }

  packageJson.scripts ??= {};

  if (
    packageJson.scripts.postinstall === postinstallScript ||
    packageJson.scripts.postinstall?.includes(postinstallScript)
  ) {
    logger.info(
      `✅ postinstall script already configured in ${PACKAGE_JSON_FILE}`,
    );

    return true;
  }

  if (packageJson.scripts.postinstall) {
    logger.warn(
      `⚠️  ${PACKAGE_JSON_FILE} already has a postinstall script. Adding a new one...`,
    );

    packageJson.scripts.postinstall += ` && ${postinstallScript}`;
  } else {
    logger.info(`📝 Adding postinstall script to ${PACKAGE_JSON_FILE}...`);
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

  logger.info(`✅ Added postinstall script to ${PACKAGE_JSON_FILE}`);
  return true;
}

/** Ensure app.config.yaml has the extension reference */
export async function ensureAppConfig(cwd = process.cwd()) {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const appConfigPath = join(rootDirectory, APP_CONFIG_FILE);
  const includePath = join(EXTENSION_POINT_FOLDER_PATH, "ext.config.yaml");

  let appConfig: AppConfig = {};
  if (existsSync(appConfigPath)) {
    try {
      const content = await readFile(appConfigPath, "utf-8");
      appConfig = (parseYaml(content) as AppConfig) || {};
    } catch (error) {
      logger.error(stringifyError(error as Error));

      const content = `extensions:\n\t${EXTENSION_POINT_ID}:\n\t\t$include: "${includePath}"`;
      logger.warn(
        `❌ Failed to parse ${APP_CONFIG_FILE}. Please add manually: \n\t${content}`,
      );

      return false;
    }
  }

  appConfig.extensions ??= {};

  if (appConfig.extensions[EXTENSION_POINT_ID]?.$include === includePath) {
    logger.info(`✅ Extension already configured in ${APP_CONFIG_FILE}`);
    return true;
  }

  // Add or update the extension
  logger.info(`📝 Updating ${APP_CONFIG_FILE}...`);
  appConfig.extensions[EXTENSION_POINT_ID] = {
    $include: includePath,
    ...appConfig.extensions[EXTENSION_POINT_ID],
  };

  const yamlContent = stringifyYaml(appConfig, {
    indent: 2,
    lineWidth: 0,
  });

  await writeFile(appConfigPath, yamlContent, "utf-8");
  logger.info(`✅ Updated ${APP_CONFIG_FILE}`);

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
  const envContent = existsSync(envPath)
    ? await readFile(envPath, "utf-8")
    : "";

  const existingEnvVars = extractEnvVars(envContent);
  const requiredVars = ["LOG_LEVEL", ...COMMERCE_VARIABLES];
  const missingVars = requiredVars.filter((v) => !existingEnvVars.has(v));

  if (missingVars.length === 0) {
    logger.info(
      `✅ All required environment variables already present in ${ENV_FILE}`,
    );

    return true;
  }

  logger.info(`📝 Adding environment variable placeholders to ${ENV_FILE}...`);
  let newContent = "";

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
  logger.info(`✅ Added environment variable placeholders to ${ENV_FILE}`);

  return true;
}

/** Install required dependencies */
export function installDependencies(
  packageManager: PackageManager,
  cwd = process.cwd(),
) {
  logger.info("📦 Installing dependencies...");
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

    logger.info("✅ Dependencies installed successfully");
    return true;
  } catch (error) {
    logger.error(stringifyError(error as Error));
    logger.error(
      `❌  Failed to install dependencies automatically. Please install manually: ${installCommand}`,
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
    execSync(`${execCommand} @adobe/aio-commerce-lib-config generate all`, {
      cwd,
      stdio: "inherit",
    });
  } catch (error) {
    logger.error(stringifyError(error as Error));
    logger.error(
      `❌  Failed to run generation command. Please run manually: ${execCommand} @adobe/aio-commerce-lib-config generate all`,
    );

    return false;
  }

  return true;
}

/** Ensure install.yaml has the extension reference */
export async function ensureInstallYaml(cwd = process.cwd()) {
  const rootDirectory = await getProjectRootDirectory(cwd);
  const installYamlPath = join(rootDirectory, INSTALL_YAML_FILE);

  let installYaml: InstallYaml = { extensions: [] };

  if (existsSync(installYamlPath)) {
    try {
      const content = await readFile(installYamlPath, "utf-8");
      installYaml = parseYaml(content) as InstallYaml;
    } catch (error) {
      logger.error(stringifyError(error as Error));

      const content = `extensions:\n  - ${EXTENSION_POINT_ID}`;
      logger.warn(
        `❌ Failed to parse ${INSTALL_YAML_FILE}. Please add manually: \n\t${content}`,
      );

      return false;
    }
  }

  installYaml.extensions ??= [];
  const hasExtension = installYaml.extensions.some(
    (ext) => ext.extensionPointId === EXTENSION_POINT_ID,
  );

  if (hasExtension) {
    logger.info(`✅ Extension already configured in ${INSTALL_YAML_FILE}`);
    return true;
  }

  // Add the extension (preserving existing ones)
  logger.info(`📝 Updating ${INSTALL_YAML_FILE}...`);
  installYaml.extensions.push({ extensionPointId: EXTENSION_POINT_ID });

  await writeFile(
    installYamlPath,
    stringifyYaml(installYaml, { indent: 2, lineWidth: 0 }),
    "utf-8",
  );

  logger.info(`✅ Updated ${INSTALL_YAML_FILE}`);
  return true;
}
