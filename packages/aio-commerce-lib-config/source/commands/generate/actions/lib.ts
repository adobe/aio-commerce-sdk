import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import {
  CONFIG_SCHEMA_FILE_NAME,
  EXTENSION_POINT_FOLDER,
  GENERATED_ACTIONS_PATH,
  GENERATED_PATH,
  PACKAGE_NAME,
} from "#commands/constants";

import { ACTION_INPUTS, RUNTIME_ACTIONS } from "./constants";
import { logger } from "./logger";

import type { ActionConfig, ActionDefinition, ExtConfig } from "./types";

/** Update the ext.config.yaml file */
export async function updateExtConfig() {
  logger.info("📝 Updating ext.config.yaml...");

  const extConfigPath = join(EXTENSION_POINT_FOLDER, "ext.config.yaml");
  const extConfig = await readExtConfig(extConfigPath);

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
      LOG_LEVEL: "info",
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
 * Read the ext.config.yaml file
 * @param configPath - The path to the ext.config.yaml file
 */
async function readExtConfig(configPath: string) {
  if (!existsSync(configPath)) {
    return {};
  }

  const content = await readFile(configPath, "utf-8");
  return (parseYaml(content) as ExtConfig) || {};
}

/**
 * Write the ext.config.yaml file
 * @param configPath - The path to the ext.config.yaml file
 * @param config - The config to write
 */
async function writeExtConfig(configPath: string, config: ExtConfig) {
  const yamlContent = stringifyYaml(config, {
    indent: 2,
    lineWidth: 0,
    defaultStringType: "PLAIN",
  });

  await writeFile(configPath, yamlContent, "utf-8");
}
