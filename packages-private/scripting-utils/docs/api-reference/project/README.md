# `project`: Module

This module exports shared project utilities for the AIO Commerce SDK.

## Type Aliases

| Type Alias                                                     | Description                                     |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [PackageDependency](type-aliases/PackageDependency.md)         | -                                               |
| [PackageInstallOptions](type-aliases/PackageInstallOptions.md) | -                                               |
| [PackageManager](type-aliases/PackageManager.md)               | The package manager used to install the package |

## Functions

| Function                                                                        | Description                                                                                                                  |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [detectPackageManager](functions/detectPackageManager.md)                       | Detect the package manager for a project.                                                                                    |
| [findNearestPackageJson](functions/findNearestPackageJson.md)                   | Find the nearest package.json file in the current working directory or its parents                                           |
| [findUp](functions/findUp.md)                                                   | Find a file by walking up parent directories                                                                                 |
| [getExecCommand](functions/getExecCommand.md)                                   | Get the exec command that runs a **locally installed** binary from `node_modules/.bin` for the given package manager.        |
| [getInstallCommand](functions/getInstallCommand.md)                             | Get the command to install the given dependencies with the given package manager (e.g. `pnpm add foo bar`, `npm i foo bar`). |
| [getInstalledPackageVersion](functions/getInstalledPackageVersion.md)           | Resolve the installed package version from a project root.                                                                   |
| [getPackageDependencyInstallPlan](functions/getPackageDependencyInstallPlan.md) | Resolve which dependencies are missing or installed with incompatible versions.                                              |
| [getProjectInstallCommand](functions/getProjectInstallCommand.md)               | Get the command that installs a project's declared dependencies.                                                             |
| [getProjectRootDirectory](functions/getProjectRootDirectory.md)                 | Get the root directory of the project                                                                                        |
| [isESM](functions/isESM.md)                                                     | Check if the current working directory is an ESM project.                                                                    |
| [loadPackageJson](functions/loadPackageJson.md)                                 | Load the nearest package.json file with npmcli's package.json helper.                                                        |
| [makeOutputDirFor](functions/makeOutputDirFor.md)                               | Create the output directory for the given file or folder (relative to the project root)                                      |
| [mergePackageJsonDependencies](functions/mergePackageJsonDependencies.md)       | Merge required dependencies into a package.json dependency map when they are missing.                                        |
| [readPackageJson](functions/readPackageJson.md)                                 | Read the package.json file                                                                                                   |
