#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

function getPackageInfo(packageNames, packagesDir) {
  return packageNames.map((pkgName) => {
    const pkgJsonPath = join(packagesDir, pkgName, "package.json");
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    return [
      pkgJson.name,
      {
        name: pkgJson.name,
        isPrivate: pkgJson.private,
        version: pkgJson.version,
        dependencies: pkgJson.dependencies ?? {},
        devDependencies: pkgJson.devDependencies ?? {},
        peerDependencies: pkgJson.peerDependencies ?? {},
      },
    ];
  });
}

function extractDependencies(
  privatePackageNamesList,
  privatePackages,
  buildPackageDependencies,
  extractedDeps,
) {
  for (const privatePkgName of privatePackageNamesList) {
    const privatePkg = privatePackages.get(privatePkgName);

    for (const [depName, depVersion] of Object.entries(
      privatePkg.dependencies,
    )) {
      if (
        depVersion !== "workspace:*" &&
        !buildPackageDependencies.has(depName)
      ) {
        extractedDeps.dependencies.set(depName, depVersion);
      }
    }
  }
}

async function loadPackagesFromDir(packagesDir) {
  const packageNames = await readdir(packagesDir);
  return new Map(getPackageInfo(packageNames, packagesDir));
}

async function main() {
  const CWD = process.cwd();
  const logger = console;

  const _nodeModules = await readdir(join(CWD, "node_modules"));
  const pkgJsonPath = join(CWD, "package.json");
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

  const monorepoRoot = dirname(dirname(pkgJsonPath));
  const privatePackagesDir = join(monorepoRoot, "../packages-private");
  const privatePackages = await loadPackagesFromDir(privatePackagesDir);
  const privatePackageNamesList = new Set(privatePackages.keys());

  const { dependencies = {} } = pkgJson;

  const deps = new Map(Object.entries(dependencies));

  const extractedDeps = {
    dependencies: new Map(),
    peerDependencies: new Map(),
  };

  extractDependencies(
    privatePackageNamesList,
    privatePackages,
    deps,
    extractedDeps,
  );

  if (
    extractedDeps.dependencies.size > 0 ||
    extractedDeps.peerDependencies.size > 0
  ) {
    logger.info(
      `Merging ${extractedDeps.dependencies.size} dependencies and ${extractedDeps.peerDependencies.size} peerDependencies from private packages into build package`,
    );

    for (const [depName, depVersion] of extractedDeps.dependencies) {
      deps.set(depName, depVersion);
      logger.info(`  + ${depName}@${depVersion}`);
    }

    pkgJson.dependencies = Object.fromEntries(
      Array.from(deps.entries()).sort(),
    );

    await copyFile(pkgJsonPath, join(CWD, "package.json.orig"));

    await writeFile(
      pkgJsonPath,
      `${JSON.stringify(pkgJson, null, 2)}\n`,
      "utf-8",
    );

    logger.info("✓ Successfully merged private package dependencies");
  }
}

await main();
