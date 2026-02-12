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
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import {
  getProjectRootDirectory,
  makeOutputDirFor,
} from "@aio-commerce-sdk/scripting-utils/project";
import { createOrUpdateExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml/index";
import { consola } from "consola";
import { formatTree } from "consola/utils";

import {
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_ACTIONS_PATH,
} from "#commands/constants";
import { parseCommerceAppConfig } from "#config/lib/parser";

import {
  CUSTOM_IMPORTS_PLACEHOLDER,
  CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
  CUSTOM_SCRIPTS_MAP_PLACEHOLDER,
  EXT_CONFIG,
  RUNTIME_ACTIONS,
} from "./constants";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";

// This will point to the directory where the script is running from.
// This is the dist/commands directory (as we use a facade to run the commands)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Run the generate actions command */
export async function run() {
  try {
    const appManifest = await loadAppManifest();
    await generateActionFiles(appManifest);
    await updateExtConfig();
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}

/** Load the app commerce config */
async function loadAppManifest(): Promise<
  Partial<CommerceAppConfigOutputModel>
> {
  try {
    const appConfig = await parseCommerceAppConfig();
    consola.debug("Loaded app commerce config");
    return appConfig;
  } catch (error) {
    consola.warn(
      `Could not load app commerce config: ${stringifyError(error)}`,
    );
    consola.info("Using default configuration");
    return {};
  }
}

/** Update the ext.config.yaml file */
export async function updateExtConfig() {
  consola.info("Updating ext.config.yaml...");

  const outputDir = await makeOutputDirFor(EXTENSION_POINT_FOLDER_PATH);
  const extConfigPath = join(outputDir, "ext.config.yaml");
  const extConfigDoc = await readYamlFile(extConfigPath);

  await createOrUpdateExtConfig(extConfigPath, EXT_CONFIG, extConfigDoc);
  consola.success("Updated ext.config.yaml");
}

/** Generate the action files */
export async function generateActionFiles(
  appManifest: Partial<CommerceAppConfigOutputModel>,
) {
  consola.start("Generating runtime actions...");
  const outputDir = await makeOutputDirFor(
    join(EXTENSION_POINT_FOLDER_PATH, GENERATED_ACTIONS_PATH),
  );

  const templatesDir = join(__dirname, "generate/actions/templates");
  const outputFiles: string[] = [];

  for (const action of RUNTIME_ACTIONS) {
    const templatePath = join(templatesDir, action.templateFile);
    let template = await readFile(templatePath, "utf-8");

    // For installation action, inject custom script imports
    if (action.name === "installation") {
      const customScriptsTemplatePath = join(
        templatesDir,
        "custom-scripts.js.template",
      );

      const scriptsTemplate = await generateCustomScriptsTemplate(
        await readFile(customScriptsTemplatePath, "utf-8"),
        appManifest,
      );

      // There are scripts file to include.
      if (scriptsTemplate !== null) {
        template = template
          .replace(CUSTOM_SCRIPTS_LOADER_PLACEHOLDER, scriptsTemplate)
          .replace(
            "const args = { appConfig };",
            "const args = { appConfig, customScriptsLoader };",
          );
      } else {
        // No custom scripts, remove the loader references
        consola.debug(
          "No custom installation steps found, skipping custom-scripts.js generation...",
        );

        template = template.replace(
          CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
          "// No custom installation scripts configured",
        );
      }
    }

    const actionPath = join(outputDir, `${action.name}.js`);

    await writeFile(actionPath, template, "utf-8");
    outputFiles.push(` ${relative(process.cwd(), actionPath)}`);
  }

  consola.success(
    `Generated ${RUNTIME_ACTIONS.length} action(s) in ${GENERATED_ACTIONS_PATH}`,
  );

  consola.log.raw(formatTree(outputFiles, { color: "green" }));
}

/**
 * Generate the installation template with dynamic custom script imports
 */
async function generateCustomScriptsTemplate(
  template: string,
  appManifest: Partial<CommerceAppConfigOutputModel>,
) {
  const customSteps = appManifest?.installation?.customInstallationSteps || [];

  if (customSteps.length === 0) {
    return null;
  }

  // The generated installation action with will be at:
  // src/commerce-extensibility-1/.generated/actions/.generated/app-management
  // We need to resolve paths from project root to relative imports from this location
  const projectRoot = await getProjectRootDirectory();
  const installationActionDir = join(
    projectRoot,
    EXTENSION_POINT_FOLDER_PATH,
    GENERATED_ACTIONS_PATH,
  );

  // Generate import statements
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
      return `import ${importName} from "${relativeImportPath}";`;
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
