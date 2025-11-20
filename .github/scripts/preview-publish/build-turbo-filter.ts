// Script to build Turbo filter command from package names.
// Arguments:
//   - packageNames: Space-separated list of package names
// Output:
//   - Prints JSON to stdout with:
//     - filter: string (Turbo filter flags)
//
// Usage:
//   node .github/scripts/build-turbo-filter.ts "@adobe/aio-commerce-lib-config @adobe/aio-commerce-lib-api"

type TurboFilterResult = {
  filter: string;
};

/**
 * Builds Turbo filter flags from package names.
 * Uses ... suffix to include dependencies.
 */
function buildTurboFilter(packageNames: string[]): TurboFilterResult {
  const filters: string[] = [];

  for (const pkg of packageNames) {
    filters.push(`--filter=${pkg}...`);
  }

  return {
    filter: filters.join(" "),
  };
}

/** Entrypoint of the script. */
function main() {
  const packageNamesArg = process.argv[2] || "";

  if (!packageNamesArg) {
    console.error("Error: packageNames argument is required");
    console.error(
      "Usage: node .github/scripts/build-turbo-filter.ts '<packageNames>'",
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

  const result = buildTurboFilter(packageNames);
  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
