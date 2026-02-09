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
import { makeOutputDirFor } from "@aio-commerce-sdk/scripting-utils/project";
import { createOrUpdateExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml/index";
import { consola } from "consola";
import { formatTree } from "consola/utils";

import {
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_ACTIONS_PATH,
} from "#commands/constants";
import { parseCommerceAppConfig } from "#config/lib/parser";

import { EXT_CONFIG, RUNTIME_ACTIONS } from "./constants";

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
      template = await generateInstallationTemplate(template, appManifest);
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
async function generateInstallationTemplate(
  template: string,
  appManifest: Partial<CommerceAppConfigOutputModel>,
) {
  const customSteps = appManifest?.installation?.customInstallationSteps || [];

  if (customSteps.length === 0) {
    return template.replace(
      "// {{CUSTOM_SCRIPT_IMPORTS}}",
      "// No custom installation scripts configured",
    );
  }

  // The generated installation.js will be at:
  // src/commerce-extensibility-1/.generated/actions/app-management/installation.js
  // We need to resolve paths from project root to relative imports from this location
  const projectRoot = process.cwd();
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
      return `      '${scriptPath}': ${importName},`;
    })
    .join("\n");

  const loadFunction = `
/**
 * Loads custom installation scripts defined in the manifest
 * @param {Object} appConfig - Application configuration from manifest
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Object mapping script paths to loaded modules
 */
async function loadCustomInstallationScripts(appConfig, logger) {
  const customSteps = appConfig.installation?.customInstallationSteps || [];
  
  if (customSteps.length === 0) {
    logger.debug("No custom installation scripts configured");
    return {};
  }

  try {
    const loadedScripts = {
${scriptMap}
    };

    logger.debug(\`Loaded \${Object.keys(loadedScripts).length} custom installation script(s)\`);
    return loadedScripts;
  } catch (error) {
    logger.error(\`Failed to load custom installation scripts: \${error.message}\`);
    throw new Error(\`Failed to load custom installation scripts: \${error.message}\`);
  }
}
`;

  // Inject imports and function into template
  let result = template.replace(
    "// {{CUSTOM_SCRIPT_IMPORTS}}",
    `${importStatements}\n\n${loadFunction}`,
  );

  // Update installationContext to include customScripts
  result = result.replace(
    "const installationContext = { params, logger };",
    `const customScripts = await loadCustomInstallationScripts(appConfig, logger);
  const installationContext = { params, logger, customScripts };`,
  );

  return result;
}
