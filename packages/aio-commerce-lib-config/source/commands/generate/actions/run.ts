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
import {
  createOrUpdateExtConfig,
  readYamlFile,
} from "@aio-commerce-sdk/scripting-utils/yaml";
import { consola } from "consola";
import { formatTree } from "consola/utils";

import {
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_ACTIONS_PATH,
} from "#commands/constants";

import { EXT_CONFIG, RUNTIME_ACTIONS } from "./constants";

// This will point to the directory where the script is running from.
// This is the dist/commands directory (as we use a facade to run the commands)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Run the generate actions command */
export async function run() {
  try {
    await generateActionFiles();
    await updateExtConfig();
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}

/** Update the ext.config.yaml file */
async function updateExtConfig() {
  consola.info("Updating ext.config.yaml...");

  const outputDir = await makeOutputDirFor(EXTENSION_POINT_FOLDER_PATH);
  const extConfigPath = join(outputDir, "ext.config.yaml");
  const extConfigDoc = await readYamlFile(extConfigPath);

  await createOrUpdateExtConfig(extConfigPath, EXT_CONFIG, extConfigDoc);
  consola.success("Updated ext.config.yaml");
}

/** Generate the action files */
async function generateActionFiles() {
  consola.start("Generating runtime actions...");
  const outputDir = await makeOutputDirFor(
    join(EXTENSION_POINT_FOLDER_PATH, GENERATED_ACTIONS_PATH),
  );

  const templatesDir = join(__dirname, "generate/actions/templates");
  const outputFiles: string[] = [];

  for (const action of RUNTIME_ACTIONS) {
    const templatePath = join(templatesDir, action.templateFile);
    const template = await readFile(templatePath, "utf-8");
    const actionPath = join(outputDir, `${action.name}.js`);

    await writeFile(actionPath, template, "utf-8");
    outputFiles.push(` ${relative(process.cwd(), actionPath)}`);
  }

  consola.success(
    `Generated ${RUNTIME_ACTIONS.length} action(s) in ${GENERATED_ACTIONS_PATH}`,
  );

  consola.log.raw(formatTree(outputFiles, { color: "green" }));
}
