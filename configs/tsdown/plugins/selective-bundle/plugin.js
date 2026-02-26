// @ts-check

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

// configs/tsdown/plugins/selective-bundle.js
//
// Rolldown plugin that:
//   1. Bundles private package source code (via noExternal + resolveId)
//   2. Externalizes their transitive dependencies
//   3. Writes .build/package.json with only the tree-shaken transitive deps injected

import { isAbsolute, resolve } from "node:path";

import { PRIVATE_PACKAGES_INFO } from "./constants.js";
import {
  buildEnrichedPackageJson,
  buildManifest,
  getBareModuleName,
  isInsideBundledPackage,
  resolveRealPath,
  writeBuildArtifacts,
} from "./helpers.js";

/**
 * @typedef {Object} PrivatePackageInfo
 * @property {string} name - npm package name (e.g. `@aio-commerce-sdk/common-utils`)
 * @property {string} path - Absolute path to the package directory
 * @property {Record<string, string>} deps - Combined dependencies + peerDependencies (name → version)
 */

/**
 * Rolldown plugin that bundles private package source while externalizing
 * their transitive dependencies. After tree-shaking, writes an enriched
 * `package.json` to `.build/` with only the surviving transitive deps.
 *
 * @returns {import('rolldown').Plugin}
 */
export function selectiveBundlePlugin() {
  const packageRoot = process.cwd();
  const buildDir = resolve(packageRoot, ".build");
  const externalizedByPlugin = new Set();

  const privatePkgDirs = PRIVATE_PACKAGES_INFO.map((pkg) => pkg.path);
  const privatePkgNames = new Set(PRIVATE_PACKAGES_INFO.map((pkg) => pkg.name));

  return {
    name: "rolldown-plugin-selective-bundle-externals",

    resolveId(source, importer) {
      if (!importer) {
        return null;
      }

      // Internal references — always bundle
      if (
        source.startsWith(".") ||
        source.startsWith("#") ||
        isAbsolute(source)
      ) {
        return null;
      }

      // Not coming from a private package — not our concern
      const resolved = resolveRealPath(importer);
      if (!isInsideBundledPackage(resolved, privatePkgDirs)) {
        return null;
      }

      // Another private package — let the bundler handle it
      const bare = getBareModuleName(source);
      if (privatePkgNames.has(bare)) {
        return null;
      }

      // Third-party dep from inside a private package — externalize
      externalizedByPlugin.add(bare);
      return { id: source, external: true };
    },

    generateBundle(_options, bundle) {
      const manifest = buildManifest(bundle, externalizedByPlugin);
      const pkg = buildEnrichedPackageJson(packageRoot, manifest);

      writeBuildArtifacts(buildDir, manifest, pkg);
    },
  };
}
