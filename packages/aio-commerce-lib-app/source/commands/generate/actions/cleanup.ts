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

import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isDeepStrictEqual } from "node:util";

import {
  buildExtConfigDocument,
  readYamlFile,
} from "@aio-commerce-sdk/scripting-utils/yaml";
import { consola } from "consola";

import {
  APP_CONFIG_FILE,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
  INSTALL_YAML_FILE,
} from "#commands/constants";
import {
  getActionPath,
  getActionsDir,
  getExtConfigPath,
  getGeneratedDir,
  getSchemaPath,
} from "#commands/utils";
import { hasBackendUiV2Components } from "#config/index";

import {
  buildBusinessConfigurationExtConfig,
  getRuntimeActions,
} from "./config";
import {
  removeExtensionPointFromAppConfig,
  removeExtensionPointFromInstallYaml,
} from "./utils";

import type { CommerceAppConfigDomain } from "#config/index";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Paths (relative to the project root) of the files lib-app generates for the configuration extension point. */
function getConfigurationGeneratedFiles() {
  const actions = getRuntimeActions(
    buildBusinessConfigurationExtConfig(),
    "business-configuration",
  );

  return [
    ...actions.map((action) =>
      getActionPath(CONFIGURATION_EXTENSION_POINT_ID, action.name),
    ),
    getSchemaPath(),
  ];
}

/** Directories (relative to the project root) lib-app creates for the configuration extension point, deepest first. */
function getConfigurationGeneratedDirs() {
  const actionsDir = getActionsDir(CONFIGURATION_EXTENSION_POINT_ID);

  return [
    actionsDir,
    dirname(actionsDir),
    getGeneratedDir(CONFIGURATION_EXTENSION_POINT_ID),
    getExtensionPointFolderPath(CONFIGURATION_EXTENSION_POINT_ID),
  ];
}

/** Check, ignoring comments and formatting, that ext.config.yaml is what lib-app generates today. */
async function isGeneratedConfigurationExtConfig(projectRoot: string) {
  const path = join(
    projectRoot,
    getExtConfigPath(CONFIGURATION_EXTENSION_POINT_ID),
  );

  const expected = await buildExtConfigDocument(
    buildBusinessConfigurationExtConfig(),
    undefined,
    projectRoot,
  );

  return isDeepStrictEqual((await readYamlFile(path)).toJS(), expected.toJS());
}

async function removeIfEmpty(dir: string) {
  if (!existsSync(dir)) {
    return false;
  }

  if ((await readdir(dir)).length > 0) {
    return false;
  }

  await rm(dir, { recursive: true });
  return true;
}

/** Remove the entries from both YAML files and return the names of the files that changed. */
async function removeEntries(extensionPointId: string, projectRoot: string) {
  const changed: string[] = [];

  if (await removeExtensionPointFromAppConfig(extensionPointId, projectRoot)) {
    changed.push(APP_CONFIG_FILE);
  }

  if (
    await removeExtensionPointFromInstallYaml(extensionPointId, projectRoot)
  ) {
    changed.push(INSTALL_YAML_FILE);
  }

  return changed;
}

async function cleanupConfiguration(projectRoot: string, quiet: boolean) {
  const info = quiet ? () => undefined : consola.info.bind(consola);
  const id = CONFIGURATION_EXTENSION_POINT_ID;

  await Promise.all(
    getConfigurationGeneratedFiles().map(async (file) => {
      const path = join(projectRoot, file);
      if (existsSync(path)) {
        await rm(path);
        info(`Removed generated ${file}`);
      }
    }),
  );

  const extConfigFile = getExtConfigPath(id);
  const extConfigPath = join(projectRoot, extConfigFile);
  let extConfigRemoved = true;

  if (existsSync(extConfigPath)) {
    if (await isGeneratedConfigurationExtConfig(projectRoot)) {
      await rm(extConfigPath);
      info(`Removed generated ${extConfigFile}`);
    } else {
      extConfigRemoved = false;
      consola.warn(
        `${extConfigFile} has changes that lib-app did not generate, so it was kept along with its ${APP_CONFIG_FILE} and ${INSTALL_YAML_FILE} entries for ${id}. Remove them manually if the extension is no longer needed.`,
      );
    }
  }

  // Each directory can only be empty once its children are gone, so these run in order.
  await getConfigurationGeneratedDirs().reduce(async (previous, dir) => {
    await previous;
    if (await removeIfEmpty(join(projectRoot, dir))) {
      info(`Removed empty folder ${dir}`);
    }
  }, Promise.resolve());

  if (extConfigRemoved) {
    const changed = await removeEntries(id, projectRoot);
    if (changed.length > 0) {
      info(`Removed ${id} from ${changed.join(" and ")}`);
    }
  }
}

async function cleanupBackendUi(projectRoot: string, quiet: boolean) {
  const info = quiet ? () => undefined : consola.info.bind(consola);
  const id = BACKEND_UI_V2_EXTENSION_POINT_ID;
  const changed = await removeEntries(id, projectRoot);
  if (changed.length === 0) {
    return;
  }

  info(`Removed ${id} from ${changed.join(" and ")}`);

  const extConfigFile = getExtConfigPath(id);
  if (existsSync(join(projectRoot, extConfigFile))) {
    consola.warn(
      `${extConfigFile} and the web-src files for ${id} were kept because they may contain your own code. Review them and delete what you no longer need.`,
    );
  }
}

/**
 * Removes what lib-app generated for extension points the app config no longer needs.
 * Deletes generated files, an unmodified ext.config.yaml, empty generated folders, and the
 * entries in app.config.yaml and install.yaml. User-owned files are never deleted.
 * @param domains - Domains enabled in the app configuration.
 * @param config - The validated app configuration.
 * @param projectRoot - Resolved project root.
 * @param options - Set `quiet` to skip the info logs about removals. Warnings about kept files are always logged.
 */
export async function cleanupRemovedExtensions(
  domains: Set<CommerceAppConfigDomain>,
  config: CommerceAppConfigOutputModel,
  projectRoot: string,
  { quiet = false }: { quiet?: boolean } = {},
) {
  if (!domains.has("businessConfig.schema")) {
    await cleanupConfiguration(projectRoot, quiet);
  }

  if (!hasBackendUiV2Components(config)) {
    await cleanupBackendUi(projectRoot, quiet);
  }
}
