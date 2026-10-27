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
import { isMap, isNode, isScalar } from "yaml";

import {
  APP_CONFIG_FILE,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";

import type { Pair, YAMLMap } from "yaml";

/** Extension points in the order they must appear in app.config.yaml. Extensibility must be last. */
export const EXTENSION_POINT_ORDER: readonly string[] = [
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
];

/**
 * Get the position of an extension point in the required order.
 * Ids missing from the required order rank last.
 * @param id - The extension point id.
 */
export function getExtensionPointRank(id: unknown) {
  const index = EXTENSION_POINT_ORDER.indexOf(String(id));
  return index === -1 ? EXTENSION_POINT_ORDER.length : index;
}

function getExtensionsMap(root: unknown): YAMLMap | undefined {
  if (!isMap(root)) {
    return;
  }

  const extensions = root.get("extensions", true);
  return isMap(extensions) ? extensions : undefined;
}

function getPairRank(item: Pair) {
  return getExtensionPointRank(isScalar(item.key) ? item.key.value : item.key);
}

function isSorted(extensions: YAMLMap) {
  const ranks = extensions.items.map(getPairRank);
  return ranks.every((rank, index) => index === 0 || ranks[index - 1] <= rank);
}

/**
 * Check, without writing, that the extension points in app.config.yaml follow the required order.
 * Returns true when the file does not exist or has no extension points.
 * @param projectRoot - The project root containing app.config.yaml.
 */
export async function isExtensionPointsOrdered(projectRoot: string) {
  const path = join(projectRoot, APP_CONFIG_FILE);
  if (!existsSync(path)) {
    return true;
  }

  const extensions = getExtensionsMap((await readYamlFile(path)).contents);
  return extensions === undefined || isSorted(extensions);
}

/**
 * Sort the extension points (and their `$include` entries) in app.config.yaml by the required order, keeping comments.
 * Writes only when the order changes and never creates the file.
 * @param projectRoot - The project root containing app.config.yaml.
 * @returns True if the file was rewritten.
 */
export async function ensureExtensionPointsOrder(projectRoot: string) {
  const path = join(projectRoot, APP_CONFIG_FILE);
  if (!existsSync(path)) {
    return false;
  }

  const doc = await readYamlFile(path);
  const extensions = getExtensionsMap(doc.contents);
  if (extensions === undefined || isSorted(extensions)) {
    return false;
  }

  const pairs = extensions.items;
  const [first, second] = pairs;

  // The yaml library stores the comment above the first entry on the map, so it would stay
  // at the top instead of moving with its entry.
  if (extensions.commentBefore && isNode(first.key)) {
    first.key.commentBefore = extensions.commentBefore;
    extensions.commentBefore = undefined;
  }

  // Array.prototype.sort is stable, so ids with equal rank keep their relative order.
  pairs.sort((a, b) => getPairRank(a) - getPairRank(b));

  // The first entry has no blank line above it. An entry that was first and moved down
  // takes the spacing its neighbours use.
  const spaced = isNode(second?.key) && Boolean(second.key.spaceBefore);
  if (isNode(first.key) && pairs[0] !== first) {
    first.key.spaceBefore = spaced;
  }

  if (isNode(pairs[0].key)) {
    pairs[0].key.spaceBefore = false;
  }

  await writeFile(path, doc.toString(), "utf-8");
  return true;
}
