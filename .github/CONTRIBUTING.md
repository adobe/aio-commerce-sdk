# Contributing

Thanks for choosing to contribute! The following are a set of guidelines to follow when contributing to this project.

- [Contributing](#contributing)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Development](#development)
  - [Testing](#testing)
  - [Deployment](#deployment)
  - [Community \& Governance](#community--governance)

## Overview

This project is a [PNPM monorepo](https://pnpm.io/workspaces). PNPM is a faster and more efficient package manager for JavaScript compared to `npm`. When working with monorepos, `pnpm` is [recommended over `npm`](https://refine.dev/blog/pnpm-vs-npm-and-yarn/) for several key reasons:

- Superior performance and space efficiency compared to `npm`
- Strict dependency isolation that prevents cross-package access issues. Unlike `npm`'s flattened `node_modules` structure, which allows any package to access dependencies from anywhere in the monorepo (even when not declared in its `package.json`), `pnpm` maintains proper isolation.
  - This prevents subtle, hard-to-trace bugs that commonly occur with `npm` in monorepo environments.

### Turborepo

This project uses [Turborepo](https://turbo.build/repo/docs), a build system designed for managing production-ready monorepos. Turborepo optimizes your development workflow through several key features:

- **Intelligent caching**: Turbo remembers the output of any task you run and skips work that's already been done.
- **Smart task orchestration**: Automatically detects and respects dependencies between packages, ensuring tasks execute in the correct order (e.g., if `pkg-b` depends on `pkg-a`, Turbo builds `pkg-a` first when you build `pkg-b`).
- **Parallel execution**: Maximizes resource utilization by running independent tasks simultaneously across all available cores.

For detailed information on using Turborepo in this project, refer to the [official documentation](https://turbo.build/repo/docs).

## Prerequisites

- **`node`**: See the [.nvmrc](../.nvmrc) file for the recommended [Node.js](https://nodejs.org/en) version.
- **`pnpm`**: See the `packageManager` field in the [package.json](../package.json) file for the recommended [`pnpm`](https://pnpm.io/installation) version.

## Development

First, clone the repository, then `cd` into it and run `pnpm install` to install the dependencies.

```shell
git clone git@github.com:adobe/aio-commerce-sdk.git

# Make sure you don't use `npm` or `yarn`.
cd aio-commerce-sdk
pnpm install
```

### Creating a new package

Turborepo supports generating new packages via its [`turbo gen`](https://turborepo.com/docs/guides/generating-code) command. This repository implements a custom generator `create-package` for this purpose. To create a new package, run the following command:

```shell
# Or just `pnpm turbo gen` and select `create-package` from the list of generators.
pnpm turbo gen create-package
```

This will prompt you for package configuration details, such as whether to include tests or set it as private, before generating the new package in the `packages` directory.

![create-package generator](./assets/turbo-create-package.png)

> [!NOTE]
> The `create-package` generator will create the new package in the `packages` directory by default. If you want it in another directory, feel free to move it after it's created. But make sure of the following:
>
> - The `pnpm-workspace.yaml` file contains the directory where it has been moved (see [docs](https://pnpm.io/workspaces)).
> - The `repository.directory` field in the `package.json` file is modified to reflect the new location (only applicable if the package is public).

#### About private packages

The generator will ask you if you want to make the package private. If you do, the `private` field in the `package.json` file will be set to `true`, and the name will be prefixed with `@aio-commerce-sdk/` to make it a scoped to the monorepo.

> [!IMPORTANT]
> It is important to understand that private/internal packages are not published and must be referenced via the `@aio-commerce-sdk/` scope, while public packages will be published to the `npm` registry, and they are referenced via the `@adobe/` scope. Examples of private packages are:
>
> - [`@aio-commerce-sdk/config-typescript`](../configs/typescript)
> - [`@aio-commerce-sdk/config-tsdown`](../configs/tsdown)

### Linting

### Formatting

### Running tests

### Building

## Testing

## Deployment

## Community & Governance

### Code Of Conduct

This project adheres to the Adobe [code of conduct](../CODE_OF_CONDUCT.md). By participating,
you are expected to uphold this code. Please report unacceptable behavior to
[Grp-opensourceoffice@adobe.com](mailto:Grp-opensourceoffice@adobe.com).

### Have A Question?

Start by filing an issue. The existing committers on this project work to reach
consensus around project direction and issue solutions within issue threads
(when appropriate).

### Contributor License Agreement

All third-party contributions to this project must be accompanied by a signed contributor
license agreement. This gives Adobe permission to redistribute your contributions
as part of the project. [Sign our CLA](https://opensource.adobe.com/cla.html). You
only need to submit an Adobe CLA one time, so if you have submitted one previously,
you are good to go!

### Code Reviews

All submissions should come in the form of pull requests and need to be reviewed
by project committers. Read [GitHub's pull request documentation](https://help.github.com/articles/about-pull-requests/) for more information on sending pull requests.

Lastly, please follow the [pull request template](PULL_REQUEST_TEMPLATE.md) when
submitting a pull request!

### From Contributor To Committer

We love contributions from our community! If you'd like to go a step beyond contributor
and become a committer with full write access and a say in the project, you must
be invited to the project. The existing committers employ an internal nomination
process that must reach lazy consensus (silence is approval) before invitations
are issued. If you feel you are qualified and want to get more deeply involved,
feel free to reach out to existing committers to have a conversation about that.

### Security Issues

Security issues shouldn't be reported on this issue tracker. Instead, [file an issue to our security experts](https://helpx.adobe.com/security/alertus.html).
