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

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { Document, isMap, isSeq, parseDocument, YAMLMap, YAMLSeq } from "yaml";

import type { Node, Pair } from "yaml";

type GetOrCreateOptions = {
  onBeforeCreate?: (node: Pair<Node, Node>) => void;
};

type NodeTypeConfig<T extends YAMLSeq | YAMLMap> = {
  typeGuard: (node: unknown) => node is T;
  createNode: () => T;
  typeName: string;
};

/**
 * Read a YAML file and return a {@link Document}
 * @param path - The path to the YAML file
 */
export async function readYamlFile(path: string) {
  let doc = new Document();

  if (existsSync(path)) {
    try {
      const fileContent = await readFile(path, "utf-8");
      doc = parseDocument(fileContent, { keepSourceTokens: true });
    } catch (_) {
      const file = basename(path);
      throw new Error(`Failed to parse ${file}`);
    }
  }

  if (doc.contents === null) {
    // Initialize with an empty map so the document can be worked with
    doc.contents = new YAMLMap();
  }

  return doc;
}

/**
 * Generic helper to get or create a YAML node at the given path
 * @param doc - The YAML document
 * @param path - The path to the node
 * @param options - The options for the node
 * @param typeConfig - Configuration for the node type
 * @returns The existing or newly created node
 */
function getOrCreateNode<T extends YAMLSeq | YAMLMap>(
  doc: Document,
  path: string[],
  options: GetOrCreateOptions,
  typeConfig: NodeTypeConfig<T>,
): T {
  const node = doc.getIn(path);

  if (node) {
    if (!typeConfig.typeGuard(node)) {
      throw new Error(
        `Expected ${typeConfig.typeName} at path "${path.join(".")}".`,
      );
    }

    return node;
  }

  if (doc.hasIn(path)) {
    // If the path is empty, it will return undefined but has() will return true
    // Delete first so we can add without conflicts.
    doc.deleteIn(path);
  }

  const pair = doc.createPair(path.at(-1), typeConfig.createNode());
  options.onBeforeCreate?.(pair);

  if (path.length === 1) {
    doc.add(pair);
  } else {
    doc.addIn(path.slice(0, -1), pair);
  }

  return doc.getIn(path) as T;
}

/**
 * Get or create a sequence at the given path
 * @param doc - The YAML document
 * @param path - The path to the sequence
 * @param options - The options for the sequence
 */
export function getOrCreateSeq(
  doc: Document,
  path: string[],
  options?: GetOrCreateOptions,
): YAMLSeq {
  return getOrCreateNode(doc, path, options ?? {}, {
    typeGuard: isSeq,
    createNode: () => new YAMLSeq(),
    typeName: "sequence",
  });
}

/**
 * Get or create a map at the given path
 * @param doc - The YAML document
 * @param path - The path to the map
 * @param options - The options for the map
 */
export function getOrCreateMap(
  doc: Document,
  path: string[],
  options?: GetOrCreateOptions,
): YAMLMap {
  return getOrCreateNode(doc, path, options ?? {}, {
    typeGuard: isMap,
    createNode: () => new YAMLMap(),
    typeName: "map",
  });
}
