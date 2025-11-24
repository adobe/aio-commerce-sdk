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
    // Set a meta-property if file is empty.
    // Otherwise, the file can't be worked with by the `yaml` library.
    doc.setIn(["$schema"], "http://json-schema.org/draft-07/schema");
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
