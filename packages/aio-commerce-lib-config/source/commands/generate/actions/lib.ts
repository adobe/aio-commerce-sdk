import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Document, parseDocument } from "yaml";

import {
  CONFIG_SCHEMA_FILE_NAME,
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_ACTIONS_PATH,
  GENERATED_PATH,
  PACKAGE_NAME,
} from "#commands/constants";
import { makeOutputDirFor } from "#commands/utils";
import { addCommentToNode, setFlowStyleForSeq } from "#commands/yaml-helpers";

import { ACTION_INPUTS, RUNTIME_ACTIONS } from "./constants";

import type { ActionConfig, ActionDefinition, ExtConfig } from "./types";

/** Update the ext.config.yaml file */
export async function updateExtConfig() {
  process.stdout.write("📝 Updating ext.config.yaml...\n");

  const outputDir = await makeOutputDirFor(EXTENSION_POINT_FOLDER_PATH);
  const extConfigPath = join(outputDir, "ext.config.yaml");
  const extConfig = await readExtConfig(extConfigPath);

  buildHooks(extConfig);
  buildOperations(extConfig);
  buildRuntimeManifest(extConfig);

  await writeExtConfig(extConfigPath, extConfig);
  return extConfig;
}

/**
 * Build the definition for a runtime action
 * @param action - The action config
 */
function buildActionDefinition(action: ActionConfig) {
  const actionDef: ActionDefinition = {
    function: `${GENERATED_ACTIONS_PATH}/${action.name}.js`,
    web: "yes",
    runtime: "nodejs:22",
    inputs: {
      LOG_LEVEL: "$LOG_LEVEL",
    },
    annotations: {
      "require-adobe-auth": true,
      final: true,
    },
  };

  if (action.requiresCommerce) {
    Object.assign(actionDef.inputs, ACTION_INPUTS);
  }

  if (action.requiresSchema) {
    actionDef.include = [
      [`${GENERATED_PATH}/${CONFIG_SCHEMA_FILE_NAME}`, `${PACKAGE_NAME}/`],
    ];
  }

  return actionDef;
}

/**
 * Build the `operations` section of the `ext.config.yaml` file
 * @param extConfig - The ext.config.yaml file
 */
function buildOperations(extConfig: ExtConfig) {
  extConfig.operations ??= {};
  extConfig.operations.workerProcess ??= [];

  const existingOps = extConfig.operations.workerProcess.filter(
    (op) => op.impl && !op.impl.startsWith(`${PACKAGE_NAME}/`),
  );

  const ourOps = RUNTIME_ACTIONS.map((action) => ({
    type: "action" as const,
    impl: `${PACKAGE_NAME}/${action.name}`,
  }));

  extConfig.operations.workerProcess = [...existingOps, ...ourOps];
}

/**
 * Build the `runtimeManifest` section of the `ext.config.yaml` file
 * @param extConfig - The ext.config.yaml file
 */
function buildRuntimeManifest(extConfig: ExtConfig) {
  extConfig.runtimeManifest ??= {};
  extConfig.runtimeManifest.packages ??= {};
  extConfig.runtimeManifest.packages[PACKAGE_NAME] ??= {
    license: "Apache-2.0",
    actions: {},
  };

  const actions: Record<string, ActionDefinition> = {};
  const existingActions =
    extConfig.runtimeManifest.packages[PACKAGE_NAME]?.actions ?? {};

  for (const action of RUNTIME_ACTIONS) {
    actions[action.name] = buildActionDefinition(action);
  }

  extConfig.runtimeManifest.packages[PACKAGE_NAME].actions = {
    ...existingActions,
    ...actions,
  };
}

/**
 * Build the `hooks` section of the `ext.config.yaml` file
 * @param extConfig - The ext.config.yaml file
 */
function buildHooks(extConfig: ExtConfig) {
  extConfig.hooks ??= {};
  extConfig.hooks["pre-app-build"] ??= "";

  if (
    extConfig.hooks["pre-app-build"].endsWith("js") ||
    extConfig.hooks["pre-app-build"].endsWith("ts")
  ) {
    throw new Error(
      "Conflicting pre-app-build hook definition found. The hook needs to be a command in order for `@adobe/aio-commerce-lib-config` to work, not a script.",
    );
  }

  if (extConfig.hooks["pre-app-build"].trim() === "") {
    extConfig.hooks["pre-app-build"] =
      "npx @adobe/aio-commerce-lib-config generate schema";
  } else if (
    !extConfig.hooks["pre-app-build"].includes(
      "npx @adobe/aio-commerce-lib-config generate schema",
    )
  ) {
    extConfig.hooks["pre-app-build"] +=
      " && npx @adobe/aio-commerce-lib-config generate schema";
  }
}

/**
 * Read the ext.config.yaml file
 * @param configPath - The path to the ext.config.yaml file
 */
async function readExtConfig(configPath: string): Promise<ExtConfig> {
  if (!existsSync(configPath)) {
    return {};
  }

  const content = await readFile(configPath, "utf-8");
  const doc = parseDocument(content, { keepSourceTokens: true });
  return (doc.toJS() as ExtConfig) || {};
}

/**
 * Write the ext.config.yaml file
 * @param configPath - The path to the ext.config.yaml file
 * @param config - The config to write
 */
async function writeExtConfig(configPath: string, config: ExtConfig) {
  const doc = new Document(config);

  // Add comments to auto-generated sections
  addCommentToNode(
    doc,
    ["operations"],
    " This worker processes definitions are auto-generated. Do not remove or manually edit.",
  );
  addCommentToNode(
    doc,
    ["runtimeManifest", "packages", PACKAGE_NAME],
    " This package definition is auto-generated. Do not remove or manually edit.",
  );
  addCommentToNode(
    doc,
    ["hooks", "pre-app-build"],
    " This schema generation command is auto-generated. Do not remove or manually edit.",
  );

  // Set flow style for include arrays in actions
  const actions =
    config.runtimeManifest?.packages?.[PACKAGE_NAME]?.actions ?? {};
  for (const actionName of Object.keys(actions)) {
    setFlowStyleForSeq(doc, [
      "runtimeManifest",
      "packages",
      PACKAGE_NAME,
      "actions",
      actionName,
      "include",
    ]);
  }

  const yamlContent = doc.toString({
    indent: 2,
    lineWidth: 0,
    defaultStringType: "PLAIN",
  });

  await writeFile(configPath, yamlContent, "utf-8");
}
