<!--
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
-->

# `cli/` — `aio` plugin integration spike

> Status: **Spike / PoC** (branch `spike/cli`). Not published, not wired into CI.
> Goal: prove we can ship our CLI logic as TypeScript `aio` plugins under a shared
> `commerce` namespace, maintained outside the SDK repo by independent teams.

## What this proves

The SDK currently ships CLIs as package `bin` entries (`aio-commerce-lib-config`,
`aio-commerce-lib-app`, `aio-commerce-lib-auth`) — hand-rolled `process.argv`
dispatchers run via `npx`. This spike turns that logic into real
[oclif](https://oclif.io) plugins that load under Adobe's `aio` CLI.

| Claim | How it's demonstrated here |
| --- | --- |
| TypeScript works in oclif (no JS rewrite) | Both plugins are TS, build to JS + `oclif.manifest.json`, run under `aio` |
| Commands map by **folder path**, not package name | `src/commands/commerce/config/encryption/setup.ts` → `aio commerce config encryption setup` |
| A **facade** can aggregate independently-built plugins under one namespace | `aio-cli-plugin-commerce` lists the two children in `oclif.plugins`; `aio` loads them transitively |
| Logic can stay in the lib (**option A**) | `commerce-config` imports lib-config's command logic via a new `@adobe/aio-commerce-lib-config/cli` export |
| Internal/lifecycle commands can be **hidden** | `commerce app hooks *` are hidden from `--help` but still runnable |

## Layout

```
cli/
  aio-cli-plugin-commerce/          # facade — no commands, just oclif.plugins + deps
  aio-cli-plugin-commerce-config/   # aio commerce config encryption setup|validate  (option A: wraps lib-config)
  aio-cli-plugin-commerce-app/      # aio commerce app hooks postinstall|pre-app-build (hidden)
```

Each child plugin is a self-contained npm package. In production they would live in
their own repos; the facade (`@adobe/aio-cli-plugin-commerce`) would live in `adobe/`
and only depend on whichever sub-plugins teams register.

## Run it locally

```sh
# from repo root
pnpm install

# build the child plugins (facade needs no build)
pnpm --filter @adobe/aio-cli-plugin-commerce-config build
pnpm --filter @adobe/aio-cli-plugin-commerce-app build

# link the facade — aio loads both children transitively
aio plugins:link ./cli/aio-cli-plugin-commerce

aio commerce --help                       # both topics appear
aio commerce config encryption setup      # writes AIO_COMMERCE_CONFIG_ENCRYPTION_KEY to .env
aio commerce config encryption validate
aio commerce app --help                   # note: no `hooks` topic (hidden)
aio commerce app hooks postinstall        # hidden but runnable
```

Unlink with `aio plugins:unlink @adobe/aio-cli-plugin-commerce`.

## Findings & obstacles

- **Build profile differs from SDK libraries.** oclif discovers commands by file
  path, so the build must emit **one file per command** under `dist/commands/…`.
  A default bundle flattens/merges files and breaks discovery. The plugins use a
  per-command entry map in `tsdown.config.ts` instead of the shared `baseConfig`.
- **Local source-vs-dist resolution.** A built public SDK package resolves its
  workspace imports to TypeScript **source** via `exports` (great for vitest/tsdown,
  unusable by plain `node`/`aio`). So to run under `aio` locally, the plugin must
  **bundle** the lib from source (`deps.alwaysBundle`). In production it would instead
  depend on the published package and externalize it.
- **Option A bundling cost scales with the lib's surface.** `commerce-config` bundles
  to ~2 MB because lib-config's command path pulls transitive deps. `lib-app` is far
  heavier (esbuild, prettier, openwhisk, `.template` modules, 7 workspace libs), which
  is why the `app` hooks here are thin placeholders. This is the core trade-off behind
  the **open question** (logic in lib vs. in plugin) — see the spike write-up.
- **ESM plugins must be pre-built.** `aio plugins:link` warns it cannot auto-transpile
  a linked ESM plugin and uses compiled output — fine, since we build first.
- **`exec()` must become `throw`.** Current command `exec()` wrappers call
  `process.exit()`; an oclif command should throw and let oclif handle exit codes.
- **`punycode` / `TimeoutNaN` warnings** come from `aio-cli` itself, not these plugins.

## Open question (left intentionally open)

Where should command logic live — in the SDK lib packages (plugin is a thin
orchestrator, **option A**, shown here) or moved into the plugin packages
(**option B**)? Trade-offs are documented in the spike write-up.
