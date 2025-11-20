// Script to detect packages with changesets in a PR or branch.
// Arguments:
//   - baseRef: The base branch/ref to compare against (e.g., "origin/main" or "HEAD^1")
// Output:
//   - Prints JSON to stdout with:
//     - hasChangesets: boolean
//     - packages: string[] (array of package names)
//
// Usage (local test):
//   node .github/scripts/detect-changesets.ts origin/main HEAD
//
// Usage (in GitHub Actions):
//   node .github/scripts/detect-changesets.ts origin/${{ github.base_ref }} ${{ github.event.pull_request.head.sha }}

import getChangesets from "@changesets/read";

type ChangesetResult = {
  hasChangesets: boolean;
  packages: string[];
};

/**
 * Main function to detect packages with changesets.
 * Uses @changesets/read to get changesets added since baseRef.
 */
async function detectChangesets(baseRef: string): Promise<ChangesetResult> {
  try {
    const cwd = process.cwd();

    // Get changesets added since baseRef
    const changesets = await getChangesets(cwd, baseRef);

    if (changesets.length === 0) {
      console.log("No changesets found since", baseRef);
      return {
        hasChangesets: false,
        packages: [],
      };
    }

    console.log(`Found ${changesets.length} changeset(s) since ${baseRef}:`);
    for (const changeset of changesets) {
      console.log(`  - ${changeset.id}: ${changeset.summary}`);
    }

    // Extract unique package names from all changesets
    const allPackages = new Set<string>();
    for (const changeset of changesets) {
      for (const release of changeset.releases) {
        allPackages.add(release.name);
      }
    }

    const packagesArray = Array.from(allPackages).sort();

    if (packagesArray.length === 0) {
      console.log("No packages found in changeset files.");
      return {
        hasChangesets: false,
        packages: [],
      };
    }

    console.log(`Packages to publish: ${packagesArray.join(", ")}`);

    return {
      hasChangesets: true,
      packages: packagesArray,
    };
  } catch (error) {
    console.error("Error reading changesets:", error);
    // If there's an error (e.g., baseRef doesn't exist), return no changesets
    return {
      hasChangesets: false,
      packages: [],
    };
  }
}

/** Entrypoint of the script. */
async function main() {
  const baseRef = process.argv[2];

  if (!baseRef) {
    console.error("Error: baseRef argument is required");
    console.error(
      "Usage: node .github/scripts/detect-changesets.ts <baseRef> [headRef]",
    );
    process.exit(1);
  }

  const result = await detectChangesets(baseRef);

  // Output JSON for GitHub Actions to parse
  process.stdout.write(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
