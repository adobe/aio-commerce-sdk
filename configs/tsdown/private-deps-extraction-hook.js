import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

function getPackageInfo(privatePackageNames, privatePackagesDir) {
  return privatePackageNames.map((pkgName) => {
    const pkgJsonPath = join(privatePackagesDir, pkgName, "package.json");
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

function createDependencies(object = {}) {
  return new Map(Object.entries(object));
}

function filterForPackage(dependencies, predicate) {
  const filtered = new Map();
  for (const [key, value] of dependencies) {
    if (predicate(key, value)) {
      filtered.set(key, value);
    }
  }

  return filtered;
}

function loadPackagesFromDir(packagesDir) {
  const packageNames = readdirSync(packagesDir);
  return new Map(getPackageInfo(packageNames, packagesDir));
}

function validatePackageConfiguration(
  buildPackageDependencies,
  noExternal,
  logger,
  privatePackages,
) {
  // Case C: Check if private packages are in dependencies (should be devDependencies)
  const withinDependencies = filterForPackage(
    buildPackageDependencies.dependencies,
    (pkgName) => noExternal(pkgName, undefined),
  );

  if (withinDependencies.size > 0) {
    logger.error(
      "Private packages found in dependencies (should be devDependencies):",
      Array.from(withinDependencies.keys()),
    );
    process.exit(1);
  }

  // Case C: Check if private packages are in peerDependencies (should be devDependencies)
  const withinPeerDependencies = filterForPackage(
    buildPackageDependencies.peerDependencies,
    (pkgName) => noExternal(pkgName, undefined),
  );

  if (withinPeerDependencies.size > 0) {
    logger.error(
      "Private packages found in peerDependencies (should be devDependencies):",
      Array.from(withinPeerDependencies.keys()),
    );
    process.exit(1);
  }

  // Case A: Check if noExternal packages are missing from devDependencies
  const expectedInDevDeps = Array.from(privatePackages.keys()).filter(
    (pkgName) => noExternal(pkgName, undefined),
  );
  const missingFromDevDeps = expectedInDevDeps.filter(
    (pkgName) => !buildPackageDependencies.devDependencies.has(pkgName),
  );

  if (missingFromDevDeps.length > 0) {
    logger.error(
      "Private packages in noExternal but missing from devDependencies:",
      missingFromDevDeps,
    );
    process.exit(1);
  }
}

function extractDependencies(
  privatePackageNamesList,
  privatePackages,
  monorepoPackageNames,
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
        !monorepoPackageNames.has(depName) &&
        !buildPackageDependencies.devDependencies.has(depName) &&
        !buildPackageDependencies.dependencies.has(depName)
      ) {
        extractedDeps.dependencies.set(depName, depVersion);
      }
    }

    for (const [depName, depVersion] of Object.entries(
      privatePkg.peerDependencies,
    )) {
      if (
        depVersion !== "workspace:*" &&
        !monorepoPackageNames.has(depName) &&
        !buildPackageDependencies.peerDependencies.has(depName)
      ) {
        extractedDeps.peerDependencies.set(depName, depVersion);
      }
    }
  }
}

export async function privateDepsExtractionHook(ctx) {
  const { logger, noExternal, pkg } = ctx.options;

  const publishFlag =
    process.env.PUBLISH === "true" || process.argv.includes("--publish");
  if (!publishFlag) {
    logger.info(
      "PUBLISH not enabled, skipping private dependency extraction hook.",
    );
    return;
  }

  // Validation checks:
  // A) Developer can define noExternal, but miss adding the package to devDependencies
  // B) Developer can forget to define noExternal, but have private packages in devDependencies
  // C) Developer can define noExternal and have private packages in dependencies|peerDependencies instead of devDependencies
  // D) Package can exist that does not define noExternal, but does not have any private packages in dependencies|peerDependencies, which is ok.

  // For all cases, we want to log an error to the developer to help them fix their configuration before they run into issues with externalization during the build. The build should fail.

  // If all is configured as expected, then we want to extract the dependencies|peerDependencies from the private packages. Then we want to add them to the package.json
  // of the build package. This will ensure that the private packages are properly externalized during the build and that the build package has the correct dependencies for runtime.
  // build package dependencies should be the preferred version and should override the private packages dependencies, so when we merge keep that in mind

  // Case B & D: Early exit if noExternal is not defined
  if (!noExternal) {
    logger.info(
      "No 'noExternal' provided, skipping private package dependency check.",
    );
    return;
  }

  const pkgJson = JSON.parse(readFileSync(pkg.packageJsonPath, "utf-8"));
  const { dependencies, devDependencies, peerDependencies } = pkgJson;

  const buildPackageDependencies = {
    dependencies: createDependencies(dependencies),
    devDependencies: createDependencies(devDependencies),
    peerDependencies: createDependencies(peerDependencies),
  };

  // Get monorepo root and private packages directory
  const monorepoRoot = dirname(dirname(pkg.packageJsonPath));
  const privatePackagesDir = join(monorepoRoot, "../packages-private");
  const privatePackages = loadPackagesFromDir(privatePackagesDir);

  validatePackageConfiguration(
    buildPackageDependencies,
    noExternal,
    logger,
    privatePackages,
  );

  const privatePackageNamesList = Array.from(privatePackages.keys()).filter(
    (pkgName) => noExternal(pkgName, undefined),
  );

  if (privatePackageNamesList.length === 0) {
    logger.info("No private packages in noExternal, skipping");
    return;
  }

  logger.info(
    `Processing ${privatePackageNamesList.length} private packages in noExternal`,
  );

  const publicPackagesDir = join(monorepoRoot, "../packages");
  const configPackagesDir = join(monorepoRoot, "../configs");
  const publicPackages = loadPackagesFromDir(publicPackagesDir);
  const configPackages = loadPackagesFromDir(configPackagesDir);

  const monorepoPackageNames = new Set([
    ...publicPackages.keys(),
    ...configPackages.keys(),
    ...privatePackages.keys(),
  ]);

  const extractedDeps = {
    dependencies: new Map(),
    peerDependencies: new Map(),
  };

  extractDependencies(
    privatePackageNamesList,
    privatePackages,
    monorepoPackageNames,
    buildPackageDependencies,
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
      buildPackageDependencies.dependencies.set(depName, depVersion);
      logger.info(`  + ${depName}@${depVersion}`);
    }

    for (const [depName, depVersion] of extractedDeps.peerDependencies) {
      buildPackageDependencies.peerDependencies.set(depName, depVersion);
      logger.info(`  + ${depName}@${depVersion} (peer)`);
    }

    pkgJson.dependencies = Object.fromEntries(
      Array.from(buildPackageDependencies.dependencies.entries()).sort(),
    );
    pkgJson.peerDependencies = Object.fromEntries(
      Array.from(buildPackageDependencies.peerDependencies.entries()).sort(),
    );

    const { writeFileSync } = await import("node:fs");
    writeFileSync(
      pkg.packageJsonPath,
      `${JSON.stringify(pkgJson, null, 2)}\n`,
      "utf-8",
    );

    logger.info("✓ Successfully merged private package dependencies");
  } else {
    logger.info("No new dependencies to merge from private packages");
  }
}
