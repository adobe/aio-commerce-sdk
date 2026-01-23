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
  isESM,
  getProjectRootDirectory,
  makeOutputDirFor,
  detectPackageManager,
  getExecCommand,
} from "@aio-commerce-sdk/scripting-utils/project";

// Find a file by walking up parent directories
const configPath = await findUp("tsconfig.json");

// Find the nearest package.json
const packageJsonPath = await findNearestPackageJson();

// Read and parse package.json
const packageJson = await readPackageJson();

// Check if the project uses ESM
const esm = await isESM();

// Get the project root directory
const rootDir = await getProjectRootDirectory();

// Create an output directory relative to project root
const outputDir = await makeOutputDirFor("dist/generated");

// Detect the package manager (npm, pnpm, yarn, or bun)
const packageManager = await detectPackageManager();

// Get the appropriate exec command (npx, pnpx, yarn dlx, or bunx)
const execCommand = getExecCommand(packageManager);
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
            runtime: "nodejs:22",
          },
        },
      },
    },
  },
});
```

## API Reference

For a complete list of all available types, functions, and utilities, see the [API Reference](./api-reference/README.md).
