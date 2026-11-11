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

import { writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import {
  getOrCreateMap,
  getOrCreateSeq,
  readYamlFile,
} from "@aio-commerce-sdk/scripting-utils/yaml/helpers";
import consola from "consola";
import { isMap } from "yaml";

import { APP_CONFIG_FILE, INSTALL_YAML_FILE } from "#commands/constants";
import { getExtConfigPath } from "#commands/utils";

import type { Document, YAMLSeq } from "yaml";

/**
 * Add an extension point to the app config file.
 * @param extensionPointId - The id of the extension point.
 * @param rootDirectory - The root directory of the project.
 * @param commentBefore - The comment to add before the extension point include pair.
 */
export async function addExtensionPointToAppConfig(
  extensionPointId: string,
  rootDirectory: string,
  commentBefore: string,
) {
  const appConfigPath = join(rootDirectory, APP_CONFIG_FILE);

  let doc: Document;
  const includePath = relative(
    rootDirectory,
    join(rootDirectory, getExtConfigPath(extensionPointId)),
  );

  try {
    doc = await readYamlFile(appConfigPath);
  } catch (error) {
    const fallbackContent = `extensions:\n  ${extensionPointId}:\n    $include: "${includePath}"`;
    throw new Error(
      `Failed to parse ${APP_CONFIG_FILE}. \nPlease add manually: \n\n${fallbackContent}`,
      {
        cause: error,
      },
    );
  }

  if (doc.getIn(["extensions", extensionPointId, "$include"]) === includePath) {
    consola.success(
      `Extension "${extensionPointId}" already configured in ${APP_CONFIG_FILE}`,
    );

    return;
  }

  consola.info(
    `Adding extension "${extensionPointId}" to ${APP_CONFIG_FILE}...`,
  );

  const extensions = getOrCreateMap(doc, ["extensions"]);

  const extension = getOrCreateMap(doc, ["extensions", extensionPointId], {
    onBeforeCreate: (pair) => {
      pair.key.spaceBefore = extensions.items.length > 0;
      pair.key.commentBefore = commentBefore;
    },
  });

  extension.set("$include", includePath);
  await writeFile(appConfigPath, doc.toString(), "utf-8");
}

/**
 * Add an extension point to the install.yaml file.
 * @param extensionPointId - The id of the extension point.
 * @param rootDirectory - The root directory of the project.
 * @param commentBefore - The comment to add before the extension point include pair.
 */
export async function addExtensionPointToInstallYaml(
  extensionPointId: string,
  rootDirectory: string,
  commentBefore: string,
) {
  const installYamlPath = join(rootDirectory, INSTALL_YAML_FILE);

  let doc: Document;
  let extensions: YAMLSeq;

  try {
    doc = await readYamlFile(installYamlPath);
    extensions = getOrCreateSeq(doc, ["extensions"]);
  } catch (error) {
    const fallbackContent = `\nextensions:\n  - extensionPointId: ${extensionPointId}`;
    throw new Error(
      `Failed to parse ${INSTALL_YAML_FILE}. \nPlease add manually: \n\n${fallbackContent}`,
      {
        cause: error,
      },
    );
  }

  // Check if the extension is already configured
  if (
    extensions.items.some(
      (item) =>
        isMap(item) && item.get("extensionPointId") === extensionPointId,
    )
  ) {
    consola.success(
      `Extension "${extensionPointId}" already configured in ${INSTALL_YAML_FILE}`,
    );

    return;
  }

  consola.info(
    `Adding extension "${extensionPointId}" to ${INSTALL_YAML_FILE}...`,
  );

  const extension = doc.createPair("extensionPointId", extensionPointId);
  extension.key.spaceBefore = extensions.items.length > 0;
  extension.key.commentBefore = commentBefore;
  extensions.items.push(extension);

  await writeFile(installYamlPath, doc.toString(), "utf-8");
}
