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

import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { resolve, sep } from "node:path";

import { PRIVATE_DEPS_LOOKUP } from "./constants.js";

/**
 * Gets the bare module name from an import source string.
 * @param {string} source
 */
export function getBareModuleName(source) {
  if (source.startsWith("@")) {
    return source.split("/").slice(0, 2).join("/");
  }
  return source.split("/")[0];
}

/**
 * Resolves the real path of a file.
 * @param {string} filePath
 */
export function resolveRealPath(filePath) {
  try {
    return realpathSync(filePath);
  } catch {
    return filePath;
  }
}

/**
 * Checks if a file is inside a bundled package.
 * @param {string} filePath
 * @param {string[]} dirs
 */
export function isInsideBundledPackage(filePath, dirs) {
  return dirs.some((dir) => filePath.startsWith(dir + sep) || filePath === dir);
}

/**
 * Collects the surviving externals from a bundle.
 * @param {import('rolldown').OutputBundle} bundle
 */
export function collectSurvivingExternals(bundle) {
  const externals = new Set();

  for (const chunk of Object.values(bundle)) {
    if (chunk.type !== "chunk") {
      continue;
    }

    for (const imp of chunk.imports) {
      externals.add(getBareModuleName(imp));
    }
  }

  return externals;
}

/**
 * Intersects the externals that survived tree-shaking with the known
 * private package dependencies.
 *
 * @param {import('rolldown').OutputBundle} bundle
 * @param {Set<string>} externalizedByPlugin
 */
export function buildManifest(bundle, externalizedByPlugin) {
  /** @type {Record<string, { source: string; version: string }>} */
  const manifest = {};

  for (const ext of collectSurvivingExternals(bundle)) {
    if (!externalizedByPlugin.has(ext)) {
      continue;
    }

    const info = PRIVATE_DEPS_LOOKUP.get(ext);
    if (info) {
      manifest[ext] = info;
    }
  }

  return manifest;
}

/**
 * Creates a copy of the package's package.json with the manifest deps
 * merged in (skipping any already declared).
 *
 * @param {string} packageRoot
 * @param {Record<string, { source: string; version: string }>} manifest
 */
export function buildEnrichedPackageJson(packageRoot, manifest) {
  const pkg = JSON.parse(
    readFileSync(resolve(packageRoot, "package.json"), "utf-8"),
  );

  pkg.dependencies ??= {};

  for (const [name, info] of Object.entries(manifest)) {
    pkg.dependencies[name] ??= info.version;
  }

  pkg.dependencies = Object.fromEntries(
    Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)),
  );

  return pkg;
}

/**
 * Writes the manifest and enriched package.json to the .build/ directory.
 *
 * @param {string} buildDir
 * @param {Record<string, { source: string; version: string }>} manifest
 * @param {object} enrichedPkg
 */
export function writeBuildArtifacts(buildDir, manifest, enrichedPkg) {
  if (!existsSync(buildDir)) {
    mkdirSync(buildDir, { recursive: true });
  }

  writeFileSync(
    resolve(buildDir, ".transitive-deps.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  writeFileSync(
    resolve(buildDir, "package.json"),
    `${JSON.stringify(enrichedPkg, null, 2)}\n`,
  );
}
