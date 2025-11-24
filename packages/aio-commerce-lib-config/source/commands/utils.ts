import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { findUp } from "find-up";
import { createJiti } from "jiti";
import { Document, isNode, isSeq, parseDocument, YAMLSeq } from "yaml";

import { EXTENSIBILITY_CONFIG_FILE } from "#commands/constants";

import type { PackageJson } from "type-fest";
import type { Node, Pair } from "yaml";
import type { ExtensibilityConfig } from "#modules/schema/types";

const jiti = createJiti(import.meta.url);

/**
 * Find the nearest package.json file in the current working directory or its parents
 * @param cwd The current working directory
 * @param logger - The logger to use
 */
export async function findNearestPackageJson(cwd = process.cwd()) {
  const packageJsonPath = await findUp("package.json", { cwd });

  if (!packageJsonPath) {
    return null;
  }

  return packageJsonPath;
}

/** Read the package.json file */
export async function readPackageJson(
  cwd = process.cwd(),
): Promise<PackageJson | null> {
  const packageJsonPath = await findNearestPackageJson(cwd);
  if (!packageJsonPath) {
    return null;
  }

  return JSON.parse(await readFile(packageJsonPath, "utf-8"));
}

/**
 * Check if the current working directory is an ESM project.
 * @param cwd The current working directory
 */
export async function isESM(cwd = process.cwd()) {
  const packageJson = await readPackageJson(cwd);
  if (!packageJson) {
    return false;
  }

  return packageJson.type === "module";
}

/**
 * Get the root directory of the project
 * @param cwd The current working directory
 */
export async function getProjectRootDirectory(cwd = process.cwd()) {
  const packageJsonPath = await findNearestPackageJson(cwd);
  if (!packageJsonPath) {
    throw new Error(
      "Could not find a the root directory of the project. `package.json` file not found.",
    );
  }

  return dirname(packageJsonPath);
}

/**
 * Create the output directory for the generated files
 * @param fileOrFolder - The file or folder to create
 */
export async function makeOutputDirFor(fileOrFolder: string) {
  const rootDirectory = await getProjectRootDirectory();
  const outputDir = join(rootDirectory, fileOrFolder);

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  return outputDir;
}

/**
 * Try to find (up to the nearest package.json file) the extensibility.config.js file.
 * @param cwd The current working directory
 */
export async function readExtensibilityConfig(cwd = process.cwd()) {
  const packageJsonPath = await findNearestPackageJson(cwd);

  if (!packageJsonPath) {
    return null;
  }

  const configPath = await findUp(EXTENSIBILITY_CONFIG_FILE, {
    cwd,
    stopAt: await getProjectRootDirectory(cwd),
  });

  if (!configPath) {
    return null;
  }

  return await jiti.import<ExtensibilityConfig>(configPath);
}

/**
 * Stringify an error to a human-friendly string.
 * @param error - The error to stringify.
 */
export function stringifyError(error: Error) {
  if (error instanceof CommerceSdkValidationError) {
    return error.display();
  }

  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Add a comment before a node
 * @param doc - The YAML document
 * @param path - The path to the node
 * @param comment - The comment to add
 */
export function addCommentToNode(
  doc: Document,
  path: string[],
  comment: string,
) {
  const node: unknown = doc.getIn(path);
  if (isNode(node)) {
    node.commentBefore = comment;
  }
}

/**
 * Set flow style for all items in a sequence
 * @param doc - The YAML document
 * @param path - The path to the sequence
 */
export function setFlowStyleForSeq(doc: Document, path: string[]) {
  const node: unknown = doc.getIn(path);
  if (isSeq(node)) {
    for (const item of node.items) {
      if (isSeq(item)) {
        item.flow = true;
      }
    }
  }
}

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

type GetOrCreateOptions = {
  onBeforeCreate?: (node: Pair<Node, Node>) => void;
};

/**
 * Get or create a sequence at the given path
 * @param doc - The YAML document
 * @param path - The path to the sequence
 * @param options - The options for the sequence
 */
export function getOrCreateSeq(
  doc: Document,
  path: string[],
  options: GetOrCreateOptions,
): YAMLSeq {
  const node = doc.getIn(path);

  if (node) {
    if (!isSeq(node)) {
      throw new Error(`Expected sequence at path "${path.join(".")}".`);
    }

    return node;
  }

  if (doc.hasIn(path)) {
    // If the path is empty, it will return undefined but has() will return true
    // Delete first so we can add without conflicts.
    doc.deleteIn(path);
  }

  const pair = doc.createPair(path.at(-1), new YAMLSeq());
  options.onBeforeCreate?.(pair);

  if (path.length === 1) {
    doc.add(pair);
  } else {
    doc.addIn(path.slice(0, -1), pair);
  }

  return doc.getIn(path) as YAMLSeq;
}
