# `project`: Module

This module exports shared project utilities for the AIO Commerce SDK.

## Type Aliases

| Type Alias                                       | Description                                     |
| ------------------------------------------------ | ----------------------------------------------- |
| [PackageManager](type-aliases/PackageManager.md) | The package manager used to install the package |

## Functions

| Function                                                        | Description                                                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [detectPackageManager](functions/detectPackageManager.md)       | Detect the package manager by checking for lock files                                   |
| [findNearestPackageJson](functions/findNearestPackageJson.md)   | Find the nearest package.json file in the current working directory or its parents      |
| [findUp](functions/findUp.md)                                   | Find a file by walking up parent directories                                            |
| [getExecCommand](functions/getExecCommand.md)                   | Get the appropriate exec command based on package manager                               |
| [getProjectRootDirectory](functions/getProjectRootDirectory.md) | Get the root directory of the project                                                   |
| [isESM](functions/isESM.md)                                     | Check if the current working directory is an ESM project.                               |
| [makeOutputDirFor](functions/makeOutputDirFor.md)               | Create the output directory for the given file or folder (relative to the project root) |
| [readPackageJson](functions/readPackageJson.md)                 | Read the package.json file                                                              |
