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

import { join } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml/index";

import {
  APP_CONFIG_FILE,
  BACKEND_UI_EXTENSION_POINT_ID,
} from "#commands/constants";
import { hasAdminUi } from "#config/schema/admin-ui-sdk";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Collects every worker mass action's `runtimeAction` value from the config. */
function collectWorkerRuntimeActions(
  config: CommerceAppConfigOutputModel,
): string[] {
  if (!hasAdminUi(config)) {
    return [];
  }

  const { order, product, customer } = config.adminUi;
  return [order, product, customer]
    .flatMap((entity) => entity?.massActions ?? [])
    .filter((action) => action.type === "worker")
    .map((action) => action.runtimeAction);
}

/**
 * Reads the declared `workerProcess` `impl` values for `commerce/backend-ui/2`
 * from `app.config.yaml` at the project root. When the extension node carries a
 * `$include`, the referenced file is read and its `operations.workerProcess`
 * entries are merged in. Returns a `Set` of all declared impl strings.
 */
async function readWorkerProcessImpls(root: string): Promise<Set<string>> {
  const appConfigPath = join(root, APP_CONFIG_FILE);
  const appConfigDoc = await readYamlFile(appConfigPath);
  const appConfig = appConfigDoc.toJS() as Record<string, unknown>;

  const extensions = appConfig.extensions as
    | Record<string, unknown>
    | undefined;
  const extensionNode = extensions?.[BACKEND_UI_EXTENSION_POINT_ID] as
    | Record<string, unknown>
    | undefined;

  const impls = new Set<string>();

  function collectFromOperations(node: Record<string, unknown> | undefined) {
    const operations = node?.operations as Record<string, unknown> | undefined;
    const workerProcess = operations?.workerProcess as
      | Record<string, unknown>[]
      | undefined;

    if (Array.isArray(workerProcess)) {
      for (const entry of workerProcess) {
        const impl = entry.impl;
        if (typeof impl === "string") {
          impls.add(impl);
        }
      }
    }
  }

  collectFromOperations(extensionNode);

  // biome-ignore lint/complexity/useLiteralKeys: "$include" contains a special character that requires bracket notation
  const include = extensionNode?.["$include"];
  if (typeof include === "string") {
    const includedPath = join(root, include);
    const includedDoc = await readYamlFile(includedPath);
    const includedConfig = includedDoc.toJS() as Record<string, unknown>;
    collectFromOperations(includedConfig);
  }

  return impls;
}

/**
 * Validates that every worker mass action's `runtimeAction` matches a declared
 * `workerProcess` operation `impl` under `commerce/backend-ui/2` in
 * `app.config.yaml`. Throws `CommerceSdkValidationError` when any reference is
 * missing, naming the offending value(s) and the file to correct.
 */
export async function validateRuntimeActionReferences(
  config: CommerceAppConfigOutputModel,
  cwd = process.cwd(),
): Promise<void> {
  const referenced = [...new Set(collectWorkerRuntimeActions(config))];
  if (referenced.length === 0) {
    return;
  }

  const root = await getProjectRootDirectory(cwd);
  const declared = await readWorkerProcessImpls(root);
  const missing = referenced.filter((ref) => !declared.has(ref));

  if (missing.length > 0) {
    throw new CommerceSdkValidationError(
      `Mass action runtimeAction(s) not declared as a workerProcess operation under ${BACKEND_UI_EXTENSION_POINT_ID} in ${APP_CONFIG_FILE}: ${missing.join(", ")}`,
      { issues: [] },
    );
  }
}
