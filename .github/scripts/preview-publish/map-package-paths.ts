// Script to map package names to their file system paths.
// Arguments:
//   - packageNames: Space-separated list of package names (e.g., "@adobe/aio-commerce-lib-config @adobe/aio-commerce-lib-api")
// Output:
//   - Prints JSON to stdout with:
//     - packagePaths: string[] (array of package paths)
//
// Usage:
//   node .github/scripts/preview-publish/map-package-paths.ts "@adobe/aio-commerce-lib-config @adobe/aio-commerce-lib-api"

import { existsSync } from "node:fs";

type PackagePathsResult = {
  packagePaths: string[];
};

const ADOBE_PACKAGE_PREFIX = "@adobe/";

/**
 * Maps package names to their file system paths.
 * Converts "@adobe/package-name" to "packages/package-name"
 */
function mapPackagePaths(packageNames: string[]): PackagePathsResult {
  const packagePaths: string[] = [];

  for (const pkg of packageNames) {
    // Remove @adobe/ prefix and convert to path
    const pkgDir = pkg.replace(new RegExp(`^${ADOBE_PACKAGE_PREFIX}`), "");
    const pkgPath = `packages/${pkgDir}`;

    // Verify the path exists
    if (existsSync(pkgPath)) {
      packagePaths.push(pkgPath);
      console.error(`Mapped ${pkg} -> ${pkgPath}`);
    } else {
      console.error(`Warning: Package path ${pkgPath} not found for ${pkg}`);
    }
  }

  return {
    packagePaths,
  };
}

/** Entrypoint of the script. */
function main() {
  const packageNamesArg = process.argv[2] || "";

  if (!packageNamesArg) {
    console.error("Error: packageNames argument is required");
    console.error(
      "Usage: node .github/scripts/preview-publish/map-package-paths.ts '<packageNames>'",
    );
    process.exit(1);
  }

  // Split space-separated package names
  const packageNames = packageNamesArg
    .split(" ")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (packageNames.length === 0) {
    console.error("Error: No package names provided");
    process.exit(1);
  }

  const result = mapPackagePaths(packageNames);

  // Output JSON for GitHub Actions to parse (use stdout for data, stderr for logs)
  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
