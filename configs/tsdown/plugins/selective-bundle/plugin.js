// @ts-check

// configs/tsdown/plugins/selective-bundle.js
//
// Rolldown plugin that:
//   1. Bundles private package source code (via noExternal + resolveId)
//   2. Externalizes their transitive dependencies
//   3. Writes .build/package.json with only the tree-shaken transitive deps injected

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { PRIVATE_PACKAGES_INFO } from "./constants.js";
import {
  collectSurvivingExternals,
  getBareModuleName,
  isInsideBundledPackage,
  resolveRealPath,
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
  const privatePackages = PRIVATE_PACKAGES_INFO;
  const packageRoot = process.cwd();
  const buildDir = resolve(packageRoot, ".build");

  const privatePkgDirs = privatePackages.map((pkg) => pkg.path);
  const privatePkgNames = new Set(privatePackages.map((pkg) => pkg.name));
  const allPrivateDeps = new Map();

  for (const pkg of privatePackages) {
    for (const [dep, version] of Object.entries(pkg.deps)) {
      if (!version) {
        throw new Error(
          `Missing version for dependency "${dep}" in package "${pkg.name}"`,
        );
      }

      allPrivateDeps.set(dep, { source: pkg.name, version });
    }
  }

  /** @type {import('rolldown').Plugin} */
  const plugin = {
    name: "rolldown-plugin-selective-bundle-externals",

    resolveId(source, importer) {
      if (!importer) {
        return null;
      }

      if (source.startsWith(".") || isAbsolute(source)) {
        return null;
      }

      const resolved = resolveRealPath(importer);

      if (!isInsideBundledPackage(resolved, privatePkgDirs)) {
        return null;
      }

      const bare = getBareModuleName(source);
      if (privatePkgNames.has(bare)) {
        return null;
      }

      return { id: source, external: true };
    },

    generateBundle(_options, bundle) {
      const surviving = collectSurvivingExternals(bundle);

      const manifest = {};
      for (const ext of surviving) {
        const info = allPrivateDeps.get(ext);

        if (info) {
          manifest[ext] = info;
        }
      }

      // Write .build/
      if (!existsSync(buildDir)) {
        mkdirSync(buildDir, { recursive: true });
      }

      writeFileSync(
        resolve(buildDir, ".transitive-deps.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
      );

      // Enrich package.json with surviving transitive deps
      const pkg = JSON.parse(
        readFileSync(resolve(packageRoot, "package.json"), "utf-8"),
      );

      pkg.dependencies ??= {};

      for (const [name, info] of Object.entries(manifest)) {
        if (!pkg.dependencies[name]) {
          pkg.dependencies[name] = info.version;
        }
      }

      pkg.dependencies = Object.fromEntries(
        Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)),
      );

      writeFileSync(
        resolve(buildDir, "package.json"),
        `${JSON.stringify(pkg, null, 2)}\n`,
      );
    },
  };

  return plugin;
}
