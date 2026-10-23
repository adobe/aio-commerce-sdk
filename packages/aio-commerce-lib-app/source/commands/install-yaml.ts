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
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml/helpers";
import { isMap, isNode, isSeq } from "yaml";

import { EXTENSION_POINT_ORDER, INSTALL_YAML_FILE } from "#commands/constants";

import type { Document, YAMLSeq } from "yaml";

/**
 * Get the position of an extension point in the required order.
 * Ids missing from the required order rank last.
 * @param id - The extension point id.
 */
export function getExtensionPointRank(id: unknown) {
  const index = EXTENSION_POINT_ORDER.indexOf(String(id));
  return index === -1 ? EXTENSION_POINT_ORDER.length : index;
}

function getExtensionsSeq(doc: Document): YAMLSeq | undefined {
  const extensions = doc.get("extensions", true);
  return isSeq(extensions) ? extensions : undefined;
}

function getItemId(item: unknown) {
  return isMap(item) ? item.get("extensionPointId") : undefined;
}

function isSorted(extensions: YAMLSeq) {
  const ranks = extensions.items.map((item) =>
    getExtensionPointRank(getItemId(item)),
  );

  return ranks.every((rank, index) => index === 0 || ranks[index - 1] <= rank);
}

/**
 * Check, without writing, that the extension points in install.yaml follow the required order.
 * Returns true when the file does not exist or has no extension points.
 * @param projectRoot - The project root containing install.yaml.
 */
export async function isExtensionPointsOrdered(projectRoot: string) {
  const path = join(projectRoot, INSTALL_YAML_FILE);
  if (!existsSync(path)) {
    return true;
  }

  const extensions = getExtensionsSeq(await readYamlFile(path));
  return extensions === undefined || isSorted(extensions);
}

/**
 * Sort the extension points in install.yaml by the required order, keeping comments.
 * Writes only when the order changes and never creates the file.
 * @param projectRoot - The project root containing install.yaml.
 * @returns True if the file was rewritten.
 */
export async function ensureExtensionPointsOrder(projectRoot: string) {
  const path = join(projectRoot, INSTALL_YAML_FILE);
  if (!existsSync(path)) {
    return false;
  }

  const doc = await readYamlFile(path);
  const extensions = getExtensionsSeq(doc);
  if (extensions === undefined || isSorted(extensions)) {
    return false;
  }

  // The yaml library stores the comment above the first item on the sequence, so it would stay
  // at the top instead of moving with its item.
  const [first] = extensions.items;
  if (extensions.commentBefore && isNode(first)) {
    first.commentBefore = extensions.commentBefore;
    extensions.commentBefore = undefined;
  }

  // Array.prototype.sort is stable, so ids with equal rank keep their relative order.
  extensions.items.sort(
    (a, b) =>
      getExtensionPointRank(getItemId(a)) - getExtensionPointRank(getItemId(b)),
  );

  const [head] = extensions.items;
  if (isNode(head)) {
    head.spaceBefore = false;
  }

  await writeFile(path, doc.toString(), "utf-8");
  return true;
}
