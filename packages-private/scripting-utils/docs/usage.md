# `@aio-commerce-sdk/scripting-utils` Documentation

## Overview

This package provides utility functions for Adobe Commerce SDK scripts and build tools. It includes helpers for:

- **[Error Handling](#error-handling)**: Error stringification utilities
- **[Project Utilities](#project-utilities)**: Package detection, file finding, and project structure helpers
- **[Filesystem Utilities](#filesystem-utilities)**: Temporary file management
- **[YAML Utilities](#yaml-utilities)**: YAML document manipulation and code generation

## Error Handling

Utilities for converting errors to human-readable strings:

```typescript
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";

try {
  // Some operation that might throw
} catch (error) {
  console.error(stringifyError(error));
}
```

## Project Utilities

Helpers for working with project structure and package managers:

```typescript
import {
  findUp,
  findNearestPackageJson,
  readPackageJson,
  loadPackageJson,
  isESM,
  getProjectRootDirectory,
  makeOutputDirFor,
  detectPackageManager,
  getExecCommand,
  getInstallCommand,
  getProjectInstallCommand,
} from "@aio-commerce-sdk/scripting-utils/project";

import type { PackageInstallOptions } from "@aio-commerce-sdk/scripting-utils/project";

// Find a file by walking up parent directories
const configPath = await findUp("tsconfig.json");

// Find the nearest package.json
const packageJsonPath = await findNearestPackageJson();

// Read and parse package.json
const packageJson = await readPackageJson();

// Load the nearest package.json with @npmcli/package-json
// (returns an editable instance, or null when not found)
const pkg = await loadPackageJson();

// Check if the project uses ESM
const esm = await isESM();

// Get the project root directory
const rootDir = await getProjectRootDirectory();

// Create an output directory relative to project root
const outputDir = await makeOutputDirFor("dist/generated");

// Detect the package manager (npm, pnpm, yarn, or bun)
const packageManager = await detectPackageManager();

// Get the exec command for a locally installed binary
// (npx, pnpm exec, yarn exec, or bun x)
const execCommand = getExecCommand(packageManager);

// Get the command to install dependencies, returned as a { command, args }
// pair (e.g. { command: "pnpm", args: ["add", "foo", "bar"] })
const installCommand = getInstallCommand(packageManager, ["foo", "bar"]);

// Pass PackageInstallOptions to install as development dependencies
// (adds the manager's dev flag, e.g. args: ["add", "--save-dev", "foo", "bar"])
const installOptions: PackageInstallOptions = { dev: true };
const devInstallCommand = getInstallCommand(
  packageManager,
  ["foo", "bar"],
  installOptions,
);

// Get the { command, args } pair that installs a project's declared dependencies
// (e.g. { command: "pnpm", args: ["i"] })
const projectInstallCommand = getProjectInstallCommand(packageManager);
```

Helpers for resolving and merging package dependencies (a `PackageDependency` is a `{ name, version }` pair):

```typescript
import {
  getInstalledPackageVersion,
  getPackageDependencyInstallPlan,
  mergePackageJsonDependencies,
  loadPackageJson,
} from "@aio-commerce-sdk/scripting-utils/project";

import type { PackageDependency } from "@aio-commerce-sdk/scripting-utils/project";

// Resolve the installed version of a package (null when not installed)
const installedVersion = await getInstalledPackageVersion("react");

// Resolve which required dependencies are missing or installed
// with versions incompatible with the required semver range
const requiredDependencies: PackageDependency[] = [
  { name: "react", version: "^19.0.0" },
];

const { missing, incompatible } =
  await getPackageDependencyInstallPlan(requiredDependencies);

// Merge required dependencies into a package.json dependency map
// (only adds the ones not already declared)
const pkg = await loadPackageJson();
const dependencies = mergePackageJsonDependencies(
  pkg?.content.dependencies ?? {},
  requiredDependencies,
);
```

## Filesystem Utilities

Helpers for working with temporary files:

```typescript
import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";

// Create temporary files and execute a callback
const result = await withTempFiles(
  {
    "config.json": JSON.stringify({ key: "value" }),
    "data/input.txt": "Hello, World!",
  },
  async (tempDir) => {
    // Work with files in tempDir
    // Files are automatically cleaned up after the callback
    return processFiles(tempDir);
  },
);
```

## YAML Utilities

Helpers for reading, manipulating, and generating YAML files:

```typescript
import {
  readYamlFile,
  getOrCreateSeq,
  getOrCreateMap,
  createOrUpdateExtConfig,
} from "@aio-commerce-sdk/scripting-utils/yaml";

// Read a YAML file into a Document
const doc = await readYamlFile("config.yaml");

// Get or create a sequence at a path
const items = getOrCreateSeq(doc, ["dependencies", "packages"]);
items.add("new-package");

// Get or create a map at a path
const settings = getOrCreateMap(doc, ["settings", "advanced"]);
settings.set("enabled", true);

// Create or update an ext.config.yaml file
await createOrUpdateExtConfig("ext.config.yaml", {
  hooks: {
    "post-app-build": "$packageExec my-build-script",
  },
  operations: {
    workerProcess: [{ type: "action", impl: "my-package/my-action" }],
  },
  runtimeManifest: {
    packages: {
      "my-package": {
        license: "Apache-2.0",
        actions: {
          "my-action": {
            function: "dist/actions/my-action.js",
            web: "yes",
            runtime: "nodejs:24",
          },
        },
      },
    },
  },
});
```

## API Reference

For a complete list of all available types, functions, and utilities, see the [API Reference](./api-reference/README.md).
