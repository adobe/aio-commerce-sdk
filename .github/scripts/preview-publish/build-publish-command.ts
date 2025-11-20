// Script to build pkg-pr-new publish command with package paths.
// Arguments:
//   - packagePaths: Space-separated list of package paths (e.g., "packages/aio-commerce-lib-config packages/aio-commerce-lib-api")
// Output:
//   - Prints JSON to stdout with:
//     - command: string (full command to execute)
//
// Usage:
//   node .github/scripts/build-publish-command.ts "packages/aio-commerce-lib-config packages/aio-commerce-lib-api"

type PublishCommandResult = {
  command: string;
};

/**
 * Builds pkg-pr-new publish command with package paths.
 */
function buildPublishCommand(packagePaths: string[]): PublishCommandResult {
  const baseCommand = "pnpm dlx pkg-pr-new publish --comment=off";

  if (packagePaths.length === 0) {
    return {
      command: baseCommand,
    };
  }

  const command = `${baseCommand} ${packagePaths.join(" ")}`;
  return {
    command,
  };
}

/** Entrypoint of the script. */
function main() {
  const packagePathsArg = process.argv[2] || "";

  // Package paths are optional - if not provided, publish all packages
  const packagePaths = packagePathsArg
    ? packagePathsArg
        .split(" ")
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];

  const result = buildPublishCommand(packagePaths);

  if (packagePaths.length > 0) {
    console.log(`Publishing packages at paths: ${packagePaths.join(", ")}`);
  } else {
    console.log(
      "Warning: No package paths provided, will publish all packages",
    );
  }

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
