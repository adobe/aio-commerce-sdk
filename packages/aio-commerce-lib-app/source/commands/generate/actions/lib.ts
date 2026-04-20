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

import { readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import {
  getProjectRootDirectory,
  makeOutputDirFor,
} from "@aio-commerce-sdk/scripting-utils/project";
import { createOrUpdateExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml/index";
import { consola } from "consola";
import { formatTree } from "consola/utils";

import {
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import {
  getActionPath,
  getActionsDir,
  getExtConfigPath,
} from "#commands/utils";
import { hasCustomInstallationSteps } from "#config/index";

import {
  buildAppManagementExtConfig,
  buildBusinessConfigurationExtConfig,
  CUSTOM_IMPORTS_PLACEHOLDER,
  CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
  CUSTOM_SCRIPTS_MAP_PLACEHOLDER,
} from "./config";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type { TemplateAction } from "./config";

type ValidExtensionPointId =
  | typeof EXTENSIBILITY_EXTENSION_POINT_ID
  | typeof CONFIGURATION_EXTENSION_POINT_ID;

/** Update the ext.config.yaml file */
export async function updateExtConfig(
  appConfig: CommerceAppConfigOutputModel,
  extensionPointId: ValidExtensionPointId,
) {
  consola.info(`Updating ext.config.yaml for ${extensionPointId}...`);

  await makeOutputDirFor(getExtensionPointFolderPath(extensionPointId));
  const projectRoot = await getProjectRootDirectory();
  const extConfigPath = join(projectRoot, getExtConfigPath(extensionPointId));
  const extConfigDoc = await readYamlFile(extConfigPath);

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

  for (const action of actions) {
    const templatePath = join(templatesDir, action.templateFile);
    let template = await readFile(templatePath, "utf-8");

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
