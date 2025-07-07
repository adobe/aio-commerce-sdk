# Contributing

Thanks for choosing to contribute! The following are a set of guidelines to follow when contributing to this project.

- [Contributing](#contributing)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Project Standards](#project-standards)
  - [Development](#development)
  - [Testing](#testing)
  - [Prepare Your Package for Release](#prepare-your-package-for-release)
  - [Release Process](#release-process)
  - [Community \& Governance](#community--governance)

## Overview

This project contains a collection of packages that together form the Adobe Commerce SDK for App Builder applications. Each library is designed as a standalone, self-contained package that can be used independently in any App Builder app, following the same pattern as the [`@adobe/aio-*`](https://github.com/adobe?q=aio-lib&type=all) libraries.

In addition to these individual libraries, there's also the [`aio-commerce-sdk`](../packages/aio-commerce-sdk) package, which serves as a meta-package that re-exports selected libraries for convenience, similar to how the [`@adobe/aio-sdk`](https://github.com/adobe/aio-sdk) package works.

> [!IMPORTANT]
> The SDK should focus on re-exporting the most commonly used libraries and those that work together in similar contexts, rather than re-exporting every available library.

### PNPM Monorepo

This project is a [PNPM monorepo](https://pnpm.io/workspaces). PNPM is a faster and more efficient package manager for JavaScript compared to `npm`. When working with monorepos, `pnpm` is [recommended over `npm`](https://refine.dev/blog/pnpm-vs-npm-and-yarn/), with two of the main reasons being:

- Superior performance and space efficiency compared to `npm`

- Strict dependency isolation that prevents cross-package access issues. Unlike `npm`'s flattened `node_modules` structure, which allows any package to access dependencies from anywhere in the monorepo (even when not declared in its `package.json`), `pnpm` maintains proper isolation, preventing subtle, hard-to-trace bugs that commonly occur with `npm` in monorepo environments.
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

## Project Standards

### TypeScript

This project uses TypeScript exclusively. All source code must be written in TypeScript to ensure type safety, a better developer experience, and consistent code quality across the entire codebase.

Don't worry if you're not familiar with the language, as the project provides a complete TypeScript development framework with pre-configured tooling, type definitions, and IDE integration that makes it easy to work with it.

### ESM Over CommonJS

This project uses ECMAScript Modules (ESM) exclusively. All source code must be written in ESM to ensure compatibility with modern JavaScript and Node.js.

> [!NOTE]
> While we write all source code in ESM format, the build process generates bundles compatible with both ESM and CommonJS consumers. This dual compatibility is handled automatically by our build tool, TSDown. See [Configuring the build and exports](#configuring-the-build-and-exports) for more details.

If you're unfamiliar with the difference between ESM and CommonJS, we recommend reading [this article](https://betterstack.com/community/guides/scaling-nodejs/commonjs-vs-esm/). In short, CommonJS (CJS, `require()`) is the legacy module system introduced in Node.js in 2009. It became the de facto standard for many years due to being the only module system supported in Node.js.

While Node.js still supports CommonJS and many libraries continue to use it, ECMAScript Modules (ESM, `import/export`) have been the official standard since Node.js 13 and should be the default choice. It offers several key advantages over CommonJS, including:

- **Better tree-shaking and tooling**: ESM’s static `import/export` syntax enables bundlers to remove unused code and helps IDEs and type checkers work more efficiently.
  - There are some bundlers that support tree-shaking CJS code, but in a much more limited way.

- **Easier interoperability and gradual adoption**: ESM can `import` CommonJS modules directly, but not the other way around, unless using dynamic `import()`, which forces you to asynchronously load the module.

- **Long-term compatibility with the ecosystem**: ESM is the standard module system of JavaScript. Node.js and modern tooling (e.g. Vite, Bun, Deno) are all centered around ESM going forward. Starting with ESM avoids future migration pain.

### Documentation

Each package should provide its own documentation through both written guides (in Markdown) and inline code comments. We use JSDoc as our standard for documenting source code.

> [!TIP]
> To maintain consistent documentation, you can draft your content and use AI to rewrite it in the style of existing packages, providing them as reference examples.

When working with JSDoc in TypeScript, keep these guidelines in mind:

- **Avoid duplicating type information**: TypeScript already provides static typing, so there's no need to repeat it.
  - Use `@param name` instead of `@param {Type} name`.
  - Avoid `@returns {Type} description` or similar, just use `@returns description`.

- **Document public APIs at least**: Internal helpers or types usually don't need detailed JSDoc unless complex or reused across modules. But the exported symbols of a package should all be documented.

- **Use `@example` for tricky usage**: If a function or method is used non-obviously, include an `@example` tag to show correct usage.

- **Consistency matters**: Use consistent phrasing, punctuation, and formatting across packages. If you're unsure, follow conventions already used in existing packages.

#### API Reference

For new packages requiring API reference documentation, consider using [TypeDoc](https://typedoc.org/) with the [TypeDoc Markdown Plugin](https://typedoc-plugin-markdown.org/docs). These tools automatically generate comprehensive Markdown documentation from JSDoc annotations in your TypeScript source code, allowing you to maintain documentation alongside your code and ensuring it stays up to date.

## Development

First, clone the repository, then `cd` into it and run `pnpm install` to install the dependencies.

```shell
git clone git@github.com:adobe/aio-commerce-sdk.git

# Make sure you don't use `npm` or `yarn`.
cd aio-commerce-sdk
pnpm install
```

### Creating a New Package

Turborepo supports generating new packages via its [`turbo gen`](https://turborepo.com/docs/guides/generating-code) command. This repository implements a custom generator `create-package` for this purpose. To create a new package, run the following command:

```shell
# Or just `pnpm turbo gen` and select `create-package` from the list of generators.
pnpm turbo gen create-package
```

This will prompt you for package configuration details, such as whether to include tests or set it as private, before generating the new package in the `packages` directory.

![create-package generator](./assets/turbo-create-package.png)

> [!NOTE]
> The `create-package` generator will create the new package in the `packages` directory by default. If you want it in another directory, feel free to move it after it's created. You may also want to remove files that you don't need. In any case, make sure of the following:
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

### Using Monorepo Packages as Dependencies

Any package within the monorepo can be used as a dependency by another package. This is accomplished using the [`workspace:` protocol](https://pnpm.io/workspaces#workspace-protocol-workspace), which ensures that `pnpm` will only resolve to local workspace packages and never fetch from the npm registry.

When using the `workspace:` protocol, you can specify version ranges just like with regular semver, but `pnpm` will only link packages that exist locally in your workspace. If a matching version isn't found in the workspace, the installation will fail rather than falling back to the registry. This provides certainty that you're always using your local development versions.

If instead of using the workspace version of a package, you want to use a published version, you can use the normal syntax for semver ranges, like `^1.0.0` or `~1.0.0`. Note that, for private packages, there is no version to adhere to (or public package to pull from the registry), so you should only use the `workspace:*` syntax.

```json
{
  "dependencies": {
    "@adobe/aio-commerce-lib-example": "^1.0.0",
    "@adobe/aio-commerce-lib-other": "workspace:*"
  },
  "devDependencies": {
    "@aio-commerce-sdk/config-typescript": "workspace:*"
  }
}
```

The above example shows how to:

- Use a published version of a public package (`@adobe/aio-commerce-lib-example`) as a `dependency`.
- Use the workspace version of a public package (`@adobe/aio-commerce-lib-other`) as a `dependency`.
- Use the workspace version of a private package (`@aio-commerce-sdk/config-typescript`) as a `devDependency`.

### Code Style

This project ensures a consistent code style by using [Biome](https://biomejs.dev/) for linting and formatting. Biome is a modern, fast, and configurable linter and formatter that replaces the usual combination of `eslint` and `prettier`. It works with JSON, JavaScript, and TypeScript ([among other languages](https://biomejs.dev/internals/language-support/)) out of the box, no plugins required.

To avoid unnecessary debates around code style (since everyone has their preferences), we've configured it using the [`ultracite` preset](https://github.com/haydenbleasel/ultracite), an opinionated collection of rules carefully selected to maintain consistency. This preset is AI-ready, meaning it includes specialized AI-friendly rule files that align with the code style, ensuring that AI-generated code also meets the standards. These are:

- An `ultracite.mdc` file in `.cursor/rules`, to be used by Cursor.
- A `copilot-instructions.md` file in the `.github/` directory, to be used by GitHub Copilot.

> [!IMPORTANT]
> Please, refrain from modifying the configuration to adjust it to your liking, or to disable any rule that you don't like. You can always [supress rules](https://biomejs.dev/analyzer/suppressions/) if you need to, although we don't recommend it. If you're not able to understand what the rule is complaining about, feel free to ask for clarification, or use AI to help you understand the rule and fix the underlying issue.

#### Markdown Formatting

At the time of writing, Biome doesn't fully support linting and formatting Markdown files. To workaround this, we've configured a `format:markdown` script in the root `package.json` file, that uses [Prettier](https://prettier.io/) to format them.

> [!NOTE]
> Prettier is not installed in the project, the script pulls it from NPM without declaring it as a dependency via [`pnpx`](https://pnpm.io/cli/dlx), to avoid conflicts between tools. There's also no configuration file for it, as the opinionated defaults of Prettier are good enough for Markdown.

#### Pre-commit hook

> [!IMPORTANT]
> This hook **WILL MODIFY** your staged files to try and fix the code style issues. It will only apply safe fixes and non-destructive changes. If you have some files that can't be automatically fixed by the tool, the commit will fail and you'll need to fix the issues manually.

To ensure a consistent code style, we've configured a `pre-commit` hook via [`husky`](https://typicode.github.io/husky/). It uses [`lint-staged`](https://github.com/okonet/lint-staged) to lint and format your staged files. This hook is automatically installed when you run `pnpm install` the first time, and doesn't require any manual or additional configuration.

### Setup Your Editor

In order to make the most of your development experience, we recommend you use a VSCode-based editor, but feel free to use any other editor you prefer. The project includes some editor-specific configuration files to help you get started.

<details>
<summary><strong>VSCode</strong></summary>
<p></p>

In the `.vscode/` directory, you'll find the following files:

- `extensions.json`: A list of recommended extensions for VSCode. VSCode will prompt you to install the recommended extensions when you open the project.
- `settings.json`: A set of VSCode settings to streamline you editor experience. It configures some settings to make your life easier, like auto-formatting or code-fixing on save.

<strong>Cursor</strong>

Because Cursor is a VSCode-based editor, it will automatically pick up the `.vscode/` directory and use the settings and extensions defined there. As we explained in the [Code Style](#code-style) section, we've configured a set of rules for Cursor to help you write code that meets the project's code style, which you can find in the `.cursor/rules/` directory.

</details>

<p></p>

<details>
<summary><strong>JetBrains</strong></summary>
<p></p>

JetBrains IDEs, such as [WebStorm](https://www.jetbrains.com/webstorm/) or [IntelliJ IDEA](https://www.jetbrains.com/idea/), work well for developing in this project. However, configuring them requires more manual setup compared to VSCode's shared `settings.json` approach.

Here are some guidelines to achieve a similar development experience:

1. Install the [Biome](https://plugins.jetbrains.com/plugin/22761-biome), [Inspection Lens](https://plugins.jetbrains.com/plugin/19678-inspection-lens), and [Prettier](https://plugins.jetbrains.com/plugin/10456-prettier) plugins.
   1. Configure Prettier to run exclusively on Markdown files and Biome on all other file types to prevent conflicts. Ensure the ESLint plugin is disabled or uninstalled, as it may interfere with Biome.
2. Set up automatic execution of the `assist:apply`, `format`, and `lint:fix` scripts on file save.
   1. Refer to the documentation on [File Watchers](https://www.jetbrains.com/help/idea/using-file-watchers.html) and [Actions on Save](https://www.jetbrains.com/help/idea/saving-and-reverting-changes.html#actions-on-save) for configuration details.
3. Create [Run Configurations](https://www.jetbrains.com/help/idea/run-debug-configuration.html) according to your preferences.

</details>

## Testing

> [!TIP]
> The `create-package` generator will automatically setup testing for your package if you select to include it.

Testing is conducted on a per-package basis. While not all packages require tests (particularly those without source code), you should include them whenever applicable.

We use [Vitest](https://vitest.dev/) as our testing framework, which is a faster and more modern alternative [that replaces Jest](https://www.speakeasy.com/blog/vitest-vs-jest). Unlike the latter, Vitest provides native TypeScript support without requiring additional transpilers like Babel.

Complete documentation is available on the [Vitest website](https://vitest.dev/).

## Prepare Your Package for Release

This section guides you through preparing your package for release, covering build configuration, export setup, and ensuring proper tree-shaking support.

### Configuring the build

Packages in this repository are built with [TSDown](https://tsdown.dev/), a specialized tool for TypeScript library development. TSDown enables dual-format bundling that supports both CommonJS and ESM consumers (among other formats), while also providing tree-shaking optimization, automatic type declaration generation, and other modern build features.

To configure the build, your package requires a `tsdown.config.ts` file in its root directory. We provide a default configuration through the `@aio-commerce-sdk/config-tsdown` package, which is automatically installed when scaffolding a package with the `create-package` generator.

The default configuration should suffice for most use cases, requiring only that you specify the package entry points. To add additional entry points, simply include them in your `tsdown.config.ts` file. Refer to these packages for examples:

<!-- prettier-ignore -->
- [`@aio-commerce-sdk/config-tsdown`](../configs/tsdown/tsdown.config.base.ts): default configuration
- [`@adobe/aio-commerce-lib-auth`](../packages/lib-auth/tsdown.config.ts): single-entry public package example
- [`@adobe/aio-commerce-sdk`](../packages/aio-commerce-sdk/tsdown.config.ts): multi-entry public package example

After you have your TSDown configuration ready, you can run the `build` script to build your package, which will generate a `dist/` directory with the built files. Evaluate the output to make sure it's what you expect.

### Configuring the exports

> [!IMPORTANT]
> At the end, your `package.json` should provide the following fields before considering your package ready for release:
>
> - `"exports"`: The exports configuration.
> - `"types"`: The type declaration file.
> - `"main"`: The CommonJS entry point.
> - `"module"`: The ESM entry point.

Once you have your build files, it's time to configure your `package.json` file to declare the files that your library exports. Here's a [really good guide](https://hirok.io/posts/package-json-exports) that elaborates on the topic. If you just want to make it work, copy the package exports from the below reference packages:

- [`@adobe/aio-commerce-lib-auth`](../packages/lib-auth/package.json): single-entry public package example
- [`@adobe/aio-commerce-sdk`](../packages/aio-commerce-sdk/package.json): multi-entry public package example

### Tree-shaking

Tree shaking is the process of removing unused code from the build. It's a way to reduce the size of your package and improve the performance of your library. If the consumer of your library is only using a subset of the code exported by your package, a build tool like TSDown (or esbuild, Rollup, Webpack, etc.) will be able to remove the unused code from the build, reducing the size of the package and improving the performance of the resulting code.

Contrary to popular belief, build tools can't just magically tree-shake everything. There are some rules that you need to follow to make sure that your package is tree-shakeable. It's not necessary to follow all the rules to the letter, but doing it will help the build tool generate a smaller, more optimized build.

- **Prefer named exports over default exports**: Named exports offer better tree-shaking optimization because they allow bundlers to precisely track which parts of a module are used. Default exports may reduce tree-shaking efficiency because bundlers often treat them as a single entity, making it harder to remove unused parts within the module.

- **Eliminate circular dependencies**: Circular references between modules prevent effective dead code elimination.

- **Minimize dynamic imports**: Since dynamic imports cannot be statically analyzed, they bypass tree-shaking optimizations entirely.

- **Limit re-exports**: When the same code is re-exported through multiple entry points, bundlers may struggle to identify and remove unused portions.

- **Write side-effect-free code**: Code that produces side effects (global modifications, I/O operations, etc.) must be preserved by bundlers, preventing removal even when seemingly unused.

#### How to declare `sideEffects`

There's a non-standard key `sideEffects` in the `package.json` file that you can use to mark a package as side-effect-free. For example, if your package only exports pure functions and doesn't modify global state, you should set `"sideEffects": false` in your `package.json`:

```json
{
  "name": "@adobe/my-package",
  "sideEffects": false
}
```

However, if your package contains files that perform side effects, you should specify them explicitly:

> [!TIP]
>
> A good rule of thumb to determine if your file has side effects is to ask yourself:
>
> - Does this file modify global state (e.g., global variables, `globalThis`, or external singletons)?
> - Does it execute code during import (e.g., function calls, mutations, or logic that runs immediately on module load)?
>
> If the answer to any of the above questions is yes, then it has side effects. Note that declaring variables at the module's top level doesn't constitute "executing code," but running logic does.

```json
{
  "name": "@adobe/my-package",
  "sideEffects": [
    "./source/my-polyfill.js",
    "**/my-file-that-has-side-effects.js"
  ]
}
```

This tells bundlers that only the specified files have side effects, while all other files can be safely tree-shaken if unused.

### Add it to the SDK (optional)

As explained in the [Overview](#overview) section, the [`@adobe/aio-commerce-sdk`](../packages/aio-commerce-sdk) package re-exports certain libraries for convenience. If you want your package to be part of the SDK, you need to make sure that your library is properly re-exported by the package.

> [!IMPORTANT]
> Since the `aio-commerce-sdk` combines multiple packages, dependencies **should be installed normally** without the `workspace:` protocol. Using workspace references would complicate version management significantly and cause the SDK to always depend on the local development version rather than published releases. With standard dependencies, releasing a new version of your package allows you to simply update the corresponding version in the SDK.

Assuming you want the SDK to re-export the [`@adobe/aio-commerce-lib-auth`](../packages/aio-commerce-lib-auth) package:

1. Add it as a `dependency` to the [`@adobe/aio-commerce-sdk`](../packages/aio-commerce-sdk) package.
2. Create a `source/auth.ts` file, and then re-export everything like this:

   ```ts
   export * from "@adobe/aio-commerce-lib-auth";
   ```

3. Add it also to the [`index.ts`](../packages/aio-commerce-sdk/index.ts) entrypoint with an aliased export.

   ```ts
   export * as Auth from "@adobe/aio-commerce-lib-auth";

   // Other packages would be:
   // export * as Example from "@adobe/aio-commerce-lib-example";
   // export * as Other from "@adobe/aio-commerce-lib-other";
   ```

4. Update the `package.json` file to account for the new entrypoint you created in step 2, following the [exports](#configuring-the-exports) section.

#### Usage

Once these changes are released, consumers can access your library through two convenient patterns:

```ts
import { Auth } from "@adobe/aio-commerce-sdk";
Auth.someMethod();

// OR

import { someMethod } from "@adobe/aio-commerce-sdk/auth";
someMethod();
```

Both import patterns support tree-shaking, if you've properly configured your package as described in the [tree-shaking](#tree-shaking) section above.

## Release Process

This project follows [Semantic Versioning](https://semver.org/) and uses [Changesets](https://github.com/changesets/changesets) to manage version updates and changelogs across the monorepo.

### Semantic Versioning

We version packages using the `MAJOR.MINOR.PATCH` format:

- `MAJOR`: Breaking changes that require consumers to update their code
- `MINOR`: New features that are backward compatible
- `PATCH`: Bug fixes and minor improvements

### How Changesets Work

Here's a typical workflow when making changes:

1. **Make your changes**: You work on a feature branch that modifies `pkg-a`.
   - For the sake of the example, imagine that other packages in the monorepo (`pkg-b` and `pkg-c`) depend on `pkg-a`.

2. **Create a changeset**: Before opening a PR, run:

   ```shell
   pnpx changeset
   ```

This interactive command will:

- Prompt you to select which packages have changed
- Ask whether each change requires a patch, minor, or major version bump
- Automatically detect dependencies and suggest version bumps for dependent packages
  - (e.g., if you update `pkg-a`, it will also bump `pkg-b` and `pkg-c`)
- Request a description of the changes for the changelog

3. **Commit the changeset**: A new file is generated in the `.changeset` folder at the repository root. Commit this file alongside your code changes in the PR.

4. **Automated version management**: Once your PR is merged to `main`:
   - A GitHub Action detects pending changesets
   - It creates (or updates) a "Version Packages" PR that consolidates all pending version bumps
   - This PR accumulates changes from multiple merged PRs until you're ready to release

5. **Release**: When you merge the "Version Packages" PR:
   - Package versions are updated in their `package.json` files
   - Changelogs are generated from the changeset descriptions
   - The release workflow builds and publishes the updated packages to npm

> [!NOTE]
> A Changesets bot is configured to warn on PRs that modify packages but don't include a changeset file.

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
