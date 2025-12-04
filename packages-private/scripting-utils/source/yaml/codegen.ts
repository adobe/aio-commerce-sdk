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

import { writeFile } from "node:fs/promises";

import { Document, isMap, YAMLMap, YAMLSeq } from "yaml";

import { detectPackageManager, getExecCommand } from "#project";
import { getOrCreateMap, getOrCreateSeq } from "#yaml/helpers";

import type {
  ActionDefinition,
  ExtConfig,
  Operations,
  RuntimeManifest,
} from "#yaml/types";

/**
 * Create an ext.config.yaml file
 * @param path - The path to the ext.config.yaml file
 * @param config - The config to build
 * @param doc - The document to modify (a new one is created if not provided)
 */
export async function createOrUpdateExtConfig(
  path: string,
  config: ExtConfig,
  doc?: Document,
) {
  const extConfigDoc = doc ?? new Document();
  config.hooks ??= {};
  config.operations ??= { workerProcess: [] };
  config.runtimeManifest ??= { packages: {} };

  await buildHooks(extConfigDoc, config.hooks);
  buildOperations(extConfigDoc, config.operations);
  buildRuntimeManifest(extConfigDoc, config.runtimeManifest);

  await writeExtConfig(path, extConfigDoc);
  return extConfigDoc;
}

/**
 * Build the definition for a runtime action
 * @param name - The name of the action
 * @param path - The path where the action is located
 * @param action - The action definition
 */
function buildActionDefinition(action: ActionDefinition) {
  const actionDef: YAMLMap = new YAMLMap();
  const inputs = {
    LOG_LEVEL: "$LOG_LEVEL",
  };

  actionDef.set("function", action.function);
  actionDef.set("web", action.web ?? "yes");
  actionDef.set("runtime", action.runtime ?? "nodejs:22");
  actionDef.set("inputs", { ...inputs, ...(action.inputs ?? {}) });
  actionDef.set("annotations", {
    ...(action.annotations ?? {
      "require-adobe-auth": true,
      final: true,
    }),
  });

  const includes = action.include ?? [];
  const itemSeq = new YAMLSeq();
  itemSeq.flow = true;

  for (const [source, target] of includes) {
    itemSeq.items.push(source, target);
  }

  const seq = new YAMLSeq();
  seq.items.push(itemSeq);
  actionDef.set("include", seq);

  return actionDef;
}

/**
 * Build the `operations` section of the `ext.config.yaml` file
 * @param extConfig - The ext.config.yaml file
 * @param operations - The operations to build
 */
function buildOperations(extConfig: Document, operations: Operations) {
  getOrCreateMap(extConfig, ["operations"], {
    onBeforeCreate: (pair) => {
      pair.key.spaceBefore = true;
    },
  });

  const workerProcess = getOrCreateSeq(
    extConfig,
    ["operations", "workerProcess"],
    {
      onBeforeCreate: (pair) => {
        pair.key.commentBefore =
          " These worker processes definitions are auto-generated. Do not remove or manually edit.";
      },
    },
  );

  const ourOps = operations.workerProcess ?? [];
  const missingOps = ourOps.filter(
    (op) =>
      workerProcess.items.find(
        (item) => isMap(item) && item.get("impl") === op.impl,
      ) === undefined,
  );

  workerProcess.items.push(
    ...missingOps.map((op) => {
      const map = new YAMLMap();
      map.set("type", op.type);
      map.set("impl", op.impl);

      return map;
    }),
  );
}

/**
 * Build the `runtimeManifest` section of the `ext.config.yaml` file
 * @param extConfig - The ext.config.yaml file
 * @param packages - The packages to build
 */
export function buildRuntimeManifest(
  extConfig: Document,
  manifest: RuntimeManifest,
) {
  getOrCreateMap(extConfig, ["runtimeManifest"], {
    onBeforeCreate: (pair) => {
      pair.key.spaceBefore = true;
    },
  });

  const packages = manifest.packages ?? {};
  getOrCreateMap(extConfig, ["runtimeManifest", "packages"]);

  for (const [name, pkg] of Object.entries(packages)) {
    const packageDef = getOrCreateMap(
      extConfig,
      ["runtimeManifest", "packages", name],
      {
        onBeforeCreate: (pair) => {
          pair.key.commentBefore =
            " This package definition is auto-generated. Do not remove or manually edit.";
        },
      },
    );

    const actions = new YAMLMap();
    if (!isMap(actions)) {
      throw new Error(
        "The `actions` field in the package definition is not a map.",
      );
    }

    packageDef.set("license", pkg.license ?? "Apache-2.0");
    packageDef.set("actions", actions);

    for (const [actionName, action] of Object.entries(pkg.actions ?? {})) {
      if (actions.has(actionName)) {
        continue;
      }

      const actionDef = buildActionDefinition(action);
      actions.set(actionName, actionDef);
    }
  }
}

/**
 * Build the `hooks` section of the `ext.config.yaml` file
 * @param extConfig - The ext.config.yaml file
 * @param hooks - The hooks to build
 */
async function buildHooks(extConfig: Document, hooks: Record<string, string>) {
  const generatedHooks = `[${Object.keys(hooks).join(", ")}]`;
  const hooksMap = getOrCreateMap(extConfig, ["hooks"], {
    onBeforeCreate: (pair) => {
      pair.key.spaceBefore = true;
      pair.key.commentBefore = ` The ${generatedHooks} hooks are auto-generated. Do not remove or manually edit.`;
    },
  });

  const packageManager = await detectPackageManager();
  const execCommand = getExecCommand(packageManager);

  for (const [name, command] of Object.entries(hooks)) {
    const fullCommand = `${command.replace("$packageExec", execCommand)}`;
    const prevValue = ((hooksMap.get(name) as string | undefined) ?? "").trim();

    if (prevValue.endsWith("js") || prevValue.endsWith("ts")) {
      throw new Error(
        `Conflicting hook definition found. The "${name}" hook needs to be a command, not a script.`,
      );
    }

    if (prevValue !== "" && !prevValue.includes(fullCommand)) {
      hooksMap.set(name, `${prevValue} && ${fullCommand}`);
    } else if (prevValue === "") {
      hooksMap.set(name, fullCommand);
    }
  }
}

/**
 * Write the ext.config.yaml file
 * @param configPath - The path to the ext.config.yaml file
 * @param config - The config to write
 */
async function writeExtConfig(configPath: string, doc: Document) {
  const yamlContent = doc.toString({
    indent: 2,
    lineWidth: 0,
    defaultStringType: "PLAIN",
  });

  await writeFile(configPath, yamlContent, "utf-8");
}
