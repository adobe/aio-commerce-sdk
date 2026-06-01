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

import { readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getProjectRootDirectory,
  makeOutputDirFor,
} from "@aio-commerce-sdk/scripting-utils/project";
import { createOrUpdateExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml/index";
import NpmPackageJson from "@npmcli/package-json";
import { consola } from "consola";
import { formatTree } from "consola/utils";
import { build } from "esbuild";
import stringify from "safe-stable-stringify";

import {
  APP_CONFIG_IMPORT_ALIAS,
  BACKEND_UI_EXTENSION_POINT_ID,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import {
  getActionPath,
  getActionsDir,
  getAdminUiActionsDir,
  getAdminUiRegistrationActionPath,
  getAdminUiSdkActionsDir,
  getAdminUiSdkRegistrationActionPath,
  getExtConfigPath,
  getRuntimeAppConfigPath,
  hasDynamicAppConfig,
  prettierFormat,
} from "#commands/utils";
import {
  hasCustomInstallationSteps,
  resolveCommerceAppConfig,
} from "#config/index";

import {
  buildAdminUiSdkExtConfig,
  buildAdminUiV2ExtConfig,
  buildAppManagementExtConfig,
  buildBusinessConfigurationExtConfig,
  CUSTOM_IMPORTS_PLACEHOLDER,
  CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
  CUSTOM_SCRIPTS_MAP_PLACEHOLDER,
  REGISTRATION_JSON_PLACEHOLDER,
} from "./config";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import type { AdminUiConfig } from "#config/schema/admin-ui-sdk";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type { AdminUiSdkConfig } from "#management/installation/admin-ui-sdk/utils";
import type { TemplateAction } from "./config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** The path to the action templates directory, sibling to this file. */
export const TEMPLATES_DIR = join(__dirname, "templates");

type ValidExtensionPointId =
  | typeof EXTENSIBILITY_EXTENSION_POINT_ID
  | typeof CONFIGURATION_EXTENSION_POINT_ID
  | typeof BACKEND_UI_EXTENSION_POINT_ID
  | typeof BACKEND_UI_V2_EXTENSION_POINT_ID;

const TYPESCRIPT_CONFIG_EXTENSIONS = new Set([".ts", ".mts", ".cts"]);
const LEADING_DOT_SLASH_PATTERN = /^\.\//u;

const DYNAMIC_APP_CONFIG_IMPORT = `import appConfig from "${APP_CONFIG_IMPORT_ALIAS}";`;
const STATIC_APP_MANIFEST_IMPORT =
  'import appConfig from "../../app.commerce.manifest.json" with { type: "json" };';

const STATIC_CONFIG_SCHEMA_IMPORT =
  'import configSchema from "../../configuration-schema.json" with { type: "json" };';

/** Normalize a path for use as an ESM import specifier. */
function normalizeImportPath(path: string) {
  const normalizedPath = path.split(sep).join("/");
  return normalizedPath.startsWith(".")
    ? normalizedPath
    : `./${normalizedPath}`;
}

/** Normalize a generated file path for package.json imports. */
function normalizePackageJsonPath(path: string) {
  return normalizeImportPath(path).replace(LEADING_DOT_SLASH_PATTERN, "./");
}

/** Add or update the package import alias used by dynamic generated actions. */
async function updateAppConfigImportAlias(
  projectRoot: string,
  runtimeConfigPath: string,
) {
  const pkg = await NpmPackageJson.load(projectRoot);
  const existingImports =
    typeof pkg.content.imports === "object" && pkg.content.imports !== null
      ? pkg.content.imports
      : {};

  pkg.update({
    imports: {
      ...existingImports,
      [APP_CONFIG_IMPORT_ALIAS]: normalizePackageJsonPath(runtimeConfigPath),
    },
  });

  await pkg.save();
}

/** Remove the package import alias used only by dynamic generated actions. */
async function deleteAppConfigImportAlias(projectRoot: string) {
  const pkg = await NpmPackageJson.load(projectRoot);
  const existingImports =
    typeof pkg.content.imports === "object" && pkg.content.imports !== null
      ? pkg.content.imports
      : {};

  if (!(APP_CONFIG_IMPORT_ALIAS in existingImports)) {
    return;
  }

  const imports = { ...existingImports };
  delete imports[APP_CONFIG_IMPORT_ALIAS];

  if (Object.keys(imports).length > 0) {
    pkg.update({ imports });
  } else {
    pkg.content.imports = undefined;
  }

  await pkg.save();
}

/** Write an ESM passthrough module for JavaScript app config files. */
async function writeJavaScriptAppConfigModule(
  configFilePath: string,
  outputPath: string,
) {
  const configImportPath = normalizeImportPath(
    relative(dirname(outputPath), configFilePath),
  );

  await writeFile(
    outputPath,
    [
      "// This file has been auto-generated by `@adobe/aio-commerce-lib-app`",
      "// Do not modify this file directly",
      "",
      `import appConfig from "${configImportPath}";`,
      "",
      "export default appConfig;",
      "",
    ].join("\n"),
    "utf-8",
  );
}

/** Bundle a TypeScript app config file into runtime-safe ESM. */
async function bundleTypeScriptAppConfigModule(
  configFilePath: string,
  outputPath: string,
) {
  await build({
    entryPoints: [configFilePath],
    outfile: outputPath,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    packages: "external",
    logLevel: "silent",
  });
}

/** Generate the runtime-safe app config module used by generated runtime actions. */
async function generateRuntimeAppConfigModule() {
  const projectRoot = await getProjectRootDirectory();
  const runtimeConfigPath = getRuntimeAppConfigPath();
  await makeOutputDirFor(dirname(runtimeConfigPath));
  const outputPath = join(projectRoot, runtimeConfigPath);
  const configFilePath = await resolveCommerceAppConfig(projectRoot);

  if (!configFilePath) {
    throw new Error(
      "Dynamic list options require an app.commerce.config.* file so generated actions can import the option factories at runtime.",
    );
  }

  consola.info("Generating JS config module...");

  if (TYPESCRIPT_CONFIG_EXTENSIONS.has(extname(configFilePath))) {
    await bundleTypeScriptAppConfigModule(configFilePath, outputPath);
  } else {
    await writeJavaScriptAppConfigModule(configFilePath, outputPath);
  }

  await updateAppConfigImportAlias(projectRoot, runtimeConfigPath);
  consola.success(
    `Generated JS config module: ${relative(process.cwd(), outputPath)}`,
  );
}

/** Remove the generated app config module when generated actions use static JSON. */
async function cleanupRuntimeAppConfigModule() {
  const projectRoot = await getProjectRootDirectory();
  await rm(join(projectRoot, getRuntimeAppConfigPath()), { force: true });
  await deleteAppConfigImportAlias(projectRoot);
}

/**
 * Prepare runtime-side config artifacts consumed by generated actions: the
 * bundled ESM module and its `#app.commerce.config` package import alias.
 *
 * Generates them for dynamic schemas, cleans them up for static ones.
 */
export async function prepareRuntimeAppConfigModule(
  appManifest: CommerceAppConfigOutputModel,
) {
  if (hasDynamicAppConfig(appManifest)) {
    await generateRuntimeAppConfigModule();
    return;
  }

  await cleanupRuntimeAppConfigModule();
}

/** Switch static JSON imports to the generated runtime config module for dynamic schemas. */
function applyRuntimeAppConfigImport(template: string, actionName: string) {
  if (actionName === "app-config" || actionName === "installation") {
    return template.replace(
      STATIC_APP_MANIFEST_IMPORT,
      DYNAMIC_APP_CONFIG_IMPORT,
    );
  }

  if (actionName === "config") {
    // Dynamic mode has no separate schema file; pull the schema off the runtime config module.
    return template
      .replace(STATIC_CONFIG_SCHEMA_IMPORT, DYNAMIC_APP_CONFIG_IMPORT)
      .replace(
        "const args = { configSchema };",
        "const args = { configSchema: appConfig.businessConfig.schema };",
      );
  }

  return template;
}

/**
 * Read an extension point's ext.config.yaml file and return it as a JS object.
 * @param extensionPointId - The extension point ID to read the config for.
 */
export async function readExtConfig(extensionPointId: ValidExtensionPointId) {
  const extConfigPath = join(
    await getProjectRootDirectory(),
    getExtConfigPath(extensionPointId),
  );

  try {
    return {
      path: extConfigPath,
      doc: await readYamlFile(extConfigPath),
    };
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "Unexpected error while reading the file.";

    throw new Error(
      [
        `Could not read ext.config.yaml for ${extensionPointId} at ${extConfigPath}.`,
        `Make sure the file exists and is valid YAML. You can regenerate it with "aio-commerce-lib-app generate actions".`,
        `Reason: ${reason}`,
      ].join("\n"),
    );
  }
}

/** Update the ext.config.yaml file */
export async function updateExtConfig(
  appConfig: CommerceAppConfigOutputModel,
  extensionPointId: ValidExtensionPointId,
) {
  consola.info(`Updating ext.config.yaml for ${extensionPointId}...`);

  await makeOutputDirFor(getExtensionPointFolderPath(extensionPointId));
  const { path: extConfigPath, doc: extConfigDoc } =
    await readExtConfig(extensionPointId);

  let extConfig: ExtConfig;

  // biome-ignore lint/style/useDefaultSwitchClause: The function can only be called with the two defined extension point IDs, so a default case is not necessary
  switch (extensionPointId) {
    case EXTENSIBILITY_EXTENSION_POINT_ID: {
      extConfig = buildAppManagementExtConfig(appConfig);
      break;
    }

    case CONFIGURATION_EXTENSION_POINT_ID: {
      extConfig = buildBusinessConfigurationExtConfig();
      break;
    }

    case BACKEND_UI_EXTENSION_POINT_ID: {
      extConfig = buildAdminUiSdkExtConfig();
      break;
    }

    case BACKEND_UI_V2_EXTENSION_POINT_ID: {
      extConfig = buildAdminUiV2ExtConfig(appConfig);
      break;
    }
  }

  await createOrUpdateExtConfig(extConfigPath, extConfig, extConfigDoc);
  return extConfig;
}

/** Generate the action files */
export async function generateActionFiles(
  appManifest: CommerceAppConfigOutputModel,
  actions: TemplateAction[],
  extensionPointId: ValidExtensionPointId,
  templatesDir: string,
) {
  consola.start("Generating runtime actions...");

  await makeOutputDirFor(getActionsDir(extensionPointId));
  const projectRoot = await getProjectRootDirectory();
  const outputFiles: string[] = [];
  const useDynamicImports = hasDynamicAppConfig(appManifest);

  for (const action of actions) {
    const templatePath = join(templatesDir, action.templateFile);
    let template = await readFile(templatePath, "utf-8");

    if (useDynamicImports) {
      template = applyRuntimeAppConfigImport(template, action.name);
    }

    // For installation action, inject custom script imports
    if (action.name === "installation") {
      const customScriptsTemplatePath = join(
        templatesDir,
        "app-management",
        "custom-scripts.js.template",
      );

      const scriptsTemplate = await generateCustomScriptsTemplate(
        await readFile(customScriptsTemplatePath, "utf-8"),
        appManifest,
      );

      template = applyCustomScripts(template, scriptsTemplate);
    }

    const actionPath = join(
      projectRoot,
      getActionPath(extensionPointId, action.name),
    );

    await writeFile(actionPath, template, "utf-8");
    outputFiles.push(` ${relative(process.cwd(), actionPath)}`);
  }

  consola.success(`Generated ${actions.length} action(s)`);
  consola.log.raw(formatTree(outputFiles));
}

/**
 * Applies the given custom scripts template code to the given installation template.
 * @param installationTemplate - The installation code runtime action template
 * @param customScriptsTemplate - The custom scripts dynamically generated template.
 */
export function applyCustomScripts(
  installationTemplate: string,
  customScriptsTemplate: string | null,
) {
  // There are scripts file to include.
  if (customScriptsTemplate !== null) {
    return installationTemplate
      .replace(CUSTOM_SCRIPTS_LOADER_PLACEHOLDER, customScriptsTemplate)
      .replace(
        "const args = { appConfig };",
        "const args = { appConfig, customScriptsLoader };",
      );
  }
  // No custom scripts, remove the loader references
  consola.debug(
    "No custom installation steps found, skipping custom-scripts.js generation...",
  );

  return installationTemplate.replace(
    CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
    "// No custom installation scripts configured",
  );
}

/**
 * Generate the installation template with dynamic custom script imports
 */
export async function generateCustomScriptsTemplate(
  template: string,
  appManifest: CommerceAppConfigOutputModel,
) {
  if (!hasCustomInstallationSteps(appManifest)) {
    return null;
  }

  // We need to resolve paths from project root to relative imports from the
  // generated installation action's location.
  const projectRoot = await getProjectRootDirectory();
  const installationActionDir = join(
    projectRoot,
    getActionsDir(EXTENSIBILITY_EXTENSION_POINT_ID),
  );

  // Generate import statements
  const customSteps = appManifest.installation.customInstallationSteps;
  const importStatements = customSteps
    .map((step: CustomInstallationStep, index: number) => {
      // step.script is relative to project root (e.g., "./scripts/setup.js")
      const absoluteScriptPath = join(projectRoot, step.script);
      let relativeImportPath = relative(
        installationActionDir,
        absoluteScriptPath,
      );

      if (!relativeImportPath.startsWith(".")) {
        relativeImportPath = `./${relativeImportPath}`;
      }

      relativeImportPath = relativeImportPath.replace(/\\/g, "/");

      const importName = `customScript${index}`;
      return `import * as ${importName} from "${relativeImportPath}";`;
    })
    .join("\n");

  // Generate the loadCustomInstallationScripts function
  const scriptMap = customSteps
    .map((step: CustomInstallationStep, index: number) => {
      const scriptPath = step.script;
      const importName = `customScript${index}`;
      const entry = `"${scriptPath}": ${importName},`;

      return entry.padStart(entry.length + 6); // add indentation
    })
    .join("\n");

  // Inject imports and function into template
  const result = template.replace(CUSTOM_IMPORTS_PLACEHOLDER, importStatements);
  return result.replace(CUSTOM_SCRIPTS_MAP_PLACEHOLDER, scriptMap);
}

/**
 * Generates `registration/index.js` for the Admin UI grid column v2 extension
 * (`commerce/backend-ui/2`). The registration JSON contains only grid columns,
 * wrapped in `{ registration: { order?, product?, customer? } }`.
 * @param appManifest - The validated app config; must satisfy `hasAdminUi`.
 * @param extensionPointId - Must be `BACKEND_UI_V2_EXTENSION_POINT_ID`.
 * @param templatesDir - The root directory containing the action templates.
 */
export async function generateGridColumnsRegistrationActionFile(
  appManifest: AdminUiConfig,
  extensionPointId: typeof BACKEND_UI_V2_EXTENSION_POINT_ID,
  templatesDir = TEMPLATES_DIR,
) {
  consola.start("Generating Admin UI grid columns registration action...");

  await makeOutputDirFor(getAdminUiActionsDir(extensionPointId));
  const projectRoot = await getProjectRootDirectory();
  const templatePath = join(
    templatesDir,
    "admin-ui-sdk",
    "registration.js.template",
  );
  const template = await readFile(templatePath, "utf-8");

  const { adminUi } = appManifest;
  const registration: Record<string, unknown> = {};
  for (const gt of ["order", "product", "customer"] as const) {
    const gridColumns = adminUi[gt]?.gridColumns;
    if (gridColumns !== undefined) {
      registration[gt] = { gridColumns };
    }
  }

  const actionPath = join(
    projectRoot,
    getAdminUiRegistrationActionPath(extensionPointId),
  );
  const content = template.replace(
    REGISTRATION_JSON_PLACEHOLDER,
    `const registration = ${stringify({ registration })};`,
  );

  const formattedContent = await prettierFormat(content, actionPath);
  await writeFile(actionPath, formattedContent, "utf-8");
  consola.success(
    `Generated grid columns registration action at ${relative(process.cwd(), actionPath)}`,
  );
}

/**
 * Generates `registration/index.js` with the Admin UI SDK registration config
 * inlined as a JS object literal.
 * @param appManifest - The validated app config; must satisfy `hasAdminUiSdk`.
 * @param extensionPointId - The extension point ID that owns the registration action.
 * @param templatesDir - The root directory containing the action templates.
 */
export async function generateRegistrationActionFile(
  appManifest: AdminUiSdkConfig,
  extensionPointId: typeof BACKEND_UI_EXTENSION_POINT_ID,
  templatesDir = TEMPLATES_DIR,
) {
  consola.start("Generating Admin UI SDK registration action...");

  await makeOutputDirFor(getAdminUiSdkActionsDir(extensionPointId));
  const projectRoot = await getProjectRootDirectory();
  const templatePath = join(
    templatesDir,
    "admin-ui-sdk",
    "registration.js.template",
  );
  const template = await readFile(templatePath, "utf-8");

  const { registration } = appManifest.adminUiSdk;
  const actionPath = join(
    projectRoot,
    getAdminUiSdkRegistrationActionPath(extensionPointId),
  );
  const content = template.replace(
    REGISTRATION_JSON_PLACEHOLDER,
    `const registration = ${stringify(registration)};`,
  );

  const formattedContent = await prettierFormat(content, actionPath);

  await writeFile(actionPath, formattedContent, "utf-8");
  consola.success(
    `Generated registration action at ${relative(process.cwd(), actionPath)}`,
  );
}
