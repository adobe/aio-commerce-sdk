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

import fs from "node:fs";
import path from "node:path";

/**
 * A Rolldown plugin that automatically externalizes dependencies of private packages
 * when they are bundled through the `noExternal` configuration.
 *
 * This solves the transitive dependency bundling problem where `noExternal` bundles
 * both the private package code AND its dependencies, when we only want to bundle
 * the private package code itself.
 *
 * @param {Object} [options] - Plugin options
 * @param {string} [options.projectRoot] - Project root directory (defaults to cwd)
 * @param {string[]} [options.privatePackagePatterns] - Glob patterns for private packages (defaults to ['packages-private/*'])
 * @param {boolean} [options.verbose] - Enable verbose logging (defaults to false)
 * @returns {import('rolldown').Plugin} Rolldown plugin
 */
export function privatePackageExternalsPlugin(options = {}) {
  const {
    projectRoot = process.cwd(),
    privatePackagePatterns = ["packages-private/*"],
    verbose = false,
  } = options;

  /** @type {Map<string, {dir: string, deps: Set<string>, name: string}>} */
  const privatePackages = new Map();

  /** @type {Set<string>} */
  const allPrivatePackageNames = new Set();

  /**
   * No-op logger for silent mode
   */
  const noopLogger = {
    log() {
      // Silent mode - no logging
    },
    warn() {
      // Silent mode - no logging
    },
    error() {
      // Silent mode - no logging
    },
  };

  /**
   * Check if a dependency version is a workspace reference
   */
  function isWorkspaceDependency(version) {
    return version === "workspace:*" || version.startsWith("workspace:");
  }

  /**
   * Extract npm dependencies from a package.json (excluding workspace refs)
   */
  function extractNpmDependencies(pkgJson) {
    const deps = new Set();

    for (const [depName, depVersion] of Object.entries(
      pkgJson.dependencies || {},
    )) {
      if (!isWorkspaceDependency(depVersion)) {
        deps.add(depName);
      }
    }

    for (const [depName, depVersion] of Object.entries(
      pkgJson.peerDependencies || {},
    )) {
      if (!isWorkspaceDependency(depVersion)) {
        deps.add(depName);
      }
    }

    return deps;
  }

  /**
   * Process a single private package directory
   */
  function processPrivatePackage(pkgDir, pkgJsonPath, logger) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

      // Only process packages marked as private
      if (!pkgJson.private) {
        return;
      }

      const pkgName = pkgJson.name;
      allPrivatePackageNames.add(pkgName);

      const deps = extractNpmDependencies(pkgJson);

      privatePackages.set(pkgName, {
        dir: pkgDir,
        deps,
        name: pkgName,
      });

      logger.log(
        `[private-package-externals] Found private package: ${pkgName} with ${deps.size} npm dependencies`,
      );
    } catch (error) {
      logger.error(
        `[private-package-externals] Error reading ${pkgJsonPath}:`,
        error.message,
      );
    }
  }

  /**
   * Scan a packages directory for private packages
   */
  function scanPackagesDirectory(packagesDir, logger) {
    if (!fs.existsSync(packagesDir)) {
      logger.warn(
        `[private-package-externals] Directory not found: ${packagesDir}`,
      );
      return;
    }

    const entries = fs.readdirSync(packagesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const pkgDir = path.join(packagesDir, entry.name);
      const pkgJsonPath = path.join(pkgDir, "package.json");

      if (!fs.existsSync(pkgJsonPath)) {
        continue;
      }

      processPrivatePackage(pkgDir, pkgJsonPath, logger);
    }
  }

  /**
   * Discovers all private packages in the workspace
   */
  function discoverPrivatePackages() {
    const logger = verbose ? console : noopLogger;

    logger.log("[private-package-externals] Discovering private packages...");

    for (const pattern of privatePackagePatterns) {
      const packagesDir = path.resolve(projectRoot, pattern.replace("/*", ""));
      scanPackagesDirectory(packagesDir, logger);
    }

    logger.log(
      `[private-package-externals] Discovered ${privatePackages.size} private packages`,
    );
  }

  /**
   * Recursively collects all dependencies from private packages
   * @param {string} pkgName - Package name to start from
   * @param {Set<string>} visited - Set of already visited packages (prevents circular deps)
   * @returns {Set<string>} All npm dependencies (excluding workspace deps)
   */
  function collectTransitiveDependencies(pkgName, visited = new Set()) {
    if (visited.has(pkgName)) {
      return new Set();
    }
    visited.add(pkgName);

    const allDeps = new Set();
    const pkgInfo = privatePackages.get(pkgName);

    if (!pkgInfo) {
      return allDeps;
    }

    // Add direct dependencies
    for (const dep of pkgInfo.deps) {
      allDeps.add(dep);
    }

    // Recursively collect from other private packages this one depends on
    // Note: We need to check the actual package.json to see workspace deps
    const pkgJsonPath = path.join(pkgInfo.dir, "package.json");
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

      for (const [depName, depVersion] of Object.entries(
        pkgJson.dependencies || {},
      )) {
        if (
          (depVersion === "workspace:*" ||
            depVersion.startsWith("workspace:")) &&
          allPrivatePackageNames.has(depName)
        ) {
          // This is a workspace dependency on another private package
          const nestedDeps = collectTransitiveDependencies(depName, visited);
          for (const nestedDep of nestedDeps) {
            allDeps.add(nestedDep);
          }
        }
      }
    } catch {
      // Ignore errors, return what we have
    }

    return allDeps;
  }

  /**
   * Find which private package (if any) the importer belongs to
   */
  function findImporterPackage(importer) {
    for (const [pkgName, pkgInfo] of privatePackages) {
      const pkgDir = pkgInfo.dir;
      if (importer.startsWith(pkgDir + path.sep) || importer === pkgDir) {
        return pkgName;
      }
    }
    return null;
  }

  /**
   * Check if a source should be bundled (not externalized)
   */
  function shouldBundleSource(source) {
    // Relative or absolute imports, or internal package imports (# subpath imports)
    return (
      source.startsWith(".") || source.startsWith("/") || source.startsWith("#")
    );
  }

  /**
   * Extract bare module name from an import
   */
  function extractBareModuleName(source) {
    // Node built-ins should be externalized as-is
    if (source.startsWith("node:")) {
      return source;
    }
    // Scoped packages: @scope/pkg
    if (source.startsWith("@")) {
      return source.split("/").slice(0, 2).join("/");
    }
    // Regular packages
    return source.split("/")[0];
  }

  /**
   * Decide whether to externalize a module
   */
  function externalizeIfNeeded(source, bareModule, importerPrivatePkg) {
    // Node built-ins are always external
    if (source.startsWith("node:")) {
      return { id: source, external: true };
    }

    // Another private package should be bundled
    if (allPrivatePackageNames.has(bareModule)) {
      return null;
    }

    // Check if this is a known dependency
    const depsToExternalize = collectTransitiveDependencies(importerPrivatePkg);
    if (depsToExternalize.has(bareModule)) {
      if (verbose) {
        console.log(
          `[private-package-externals] Externalizing ${source} from ${importerPrivatePkg}`,
        );
      }
      return { id: source, external: true };
    }

    // Safety fallback: externalize other external imports
    if (bareModule !== importerPrivatePkg) {
      if (verbose) {
        console.log(
          `[private-package-externals] Externalizing (fallback) ${source} from ${importerPrivatePkg}`,
        );
      }
      return { id: source, external: true };
    }

    return null;
  }

  return {
    name: "private-package-externals",

    buildStart() {
      const logger = verbose ? console : noopLogger;

      // Discover all private packages in the workspace
      discoverPrivatePackages();

      // Log all dependencies that will be externalized for each private package
      if (verbose) {
        for (const [pkgName] of privatePackages) {
          const allDeps = collectTransitiveDependencies(pkgName);
          logger.log(
            `[private-package-externals] ${pkgName}: will externalize ${allDeps.size} total dependencies`,
          );
          if (allDeps.size > 0) {
            logger.log(`  ${Array.from(allDeps).join(", ")}`);
          }
        }
      }
    },

    resolveId(source, importer) {
      // Skip if there's no importer (entry point)
      if (!importer) {
        return null;
      }

      // Determine if the importer is inside a private package
      const importerPrivatePkg = findImporterPackage(importer);
      if (!importerPrivatePkg) {
        return null;
      }

      // Check if this should remain bundled
      if (shouldBundleSource(source)) {
        return null;
      }

      // Get bare module name and check if it should be externalized
      const bareModule = extractBareModuleName(source);
      return externalizeIfNeeded(source, bareModule, importerPrivatePkg);
    },
  };
}
