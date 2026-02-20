import { realpathSync } from "node:fs";
import { sep } from "node:path";

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
