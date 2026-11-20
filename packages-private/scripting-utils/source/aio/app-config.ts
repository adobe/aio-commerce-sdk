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

/// <reference path="./aio-cli-lib-app-config.d.ts" />

import { join } from "node:path";

import { coalesce } from "@adobe/aio-cli-lib-app-config";

const APP_CONFIG_FILE = "app.config.yaml";

type Node = Record<string, unknown>;

/** An action declared in the `runtimeManifest` of an extension. */
export type DeclaredRuntimeAction = {
  /** The `function` path, absolute, or undefined if the action does not declare one. */
  function: string | undefined;

  /** Whether the `web` property exposes the action over HTTP. */
  isWebAction: boolean;

  /** Absolute path of the file the action is declared in. */
  source: string;
};

/** Values of the `web` action property that expose the action over HTTP. */
const WEB_ACTION_VALUES = new Set<unknown>([true, "yes", "raw"]);

function asNode(value: unknown): Node {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Node)
    : {};
}

/**
 * Lists the actions declared in the `runtimeManifest` of an extension, keyed as `<package>/<action>`.
 * Loads `app.config.yaml` with the same library the `aio` CLI uses, so `$include` directives and
 * `function` paths resolve exactly as they do at build time.
 * @param projectRoot - Resolved project root containing `app.config.yaml`.
 * @param extensionPointId - The extension point ID, e.g. "commerce/extensibility/1".
 */
export async function listExtensionRuntimeActions(
  projectRoot: string,
  extensionPointId: string,
) {
  const appConfigPath = join(projectRoot, APP_CONFIG_FILE);
  const { config, includeIndex } = await coalesce(appConfigPath, {
    absolutePaths: true,
  });

  const extensionKey = `extensions.${extensionPointId}`;
  const manifest = asNode(
    asNode(asNode(config.extensions)[extensionPointId]).runtimeManifest,
  );
  const actions = new Map<string, DeclaredRuntimeAction>();

  for (const [packageName, pkg] of Object.entries(asNode(manifest.packages))) {
    for (const [actionName, rawAction] of Object.entries(
      asNode(asNode(pkg).actions),
    )) {
      const action = asNode(rawAction);
      const actionKey = `${extensionKey}.runtimeManifest.packages.${packageName}.actions.${actionName}`;
      const fn = typeof action.function === "string" ? action.function : "";

      actions.set(`${packageName}/${actionName}`, {
        function: fn || undefined,
        isWebAction: WEB_ACTION_VALUES.has(action.web),
        source: includeIndex[actionKey]?.file ?? appConfigPath,
      });
    }
  }

  return actions;
}
