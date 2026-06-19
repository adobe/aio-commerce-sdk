# `@aio-commerce-sdk/iacly`

Lightweight IaC-style reconcile engine. The library is independent of Adobe Commerce — it provides general-purpose primitives for declarative resource management. Commerce apps on App Builder are a first-class use case, not the identity of the library. See `ARCHITECTURE.md` for the design intent.

## Current state

This is a structural PoC. The source (`source/index.ts`) is an empty barrel. Interfaces and implementation come in subsequent iterations — do not add logic here without first validating the design in `ARCHITECTURE.md`.

## Commands

Run all commands scoped to this package to avoid running the full monorepo:

```sh
pnpm --filter @aio-commerce-sdk/iacly test
pnpm --filter @aio-commerce-sdk/iacly typecheck
pnpm --filter @aio-commerce-sdk/iacly lint
```

## Conventions

- Same Biome + strict TypeScript config as the rest of the monorepo.
- Tests live in `test/unit/` and `test/integration/`. Unit tests cover pure logic (diff, plan, topo-sort). Integration tests exercise providers against live or mocked external systems.
- Every source file must carry the Apache 2.0 license header (see root `AGENTS.md`).
- The library must remain free of provider-specific dependencies. Resource providers (e.g. for Commerce, I/O Events) live outside this package and depend on it — not the other way around.
- This package has no build step — it is consumed directly from source within the workspace. Do not add a `tsdown.config.ts` unless promoting to a public package.

## Promoting to a public package

1. Move to `packages/`.
2. Change the npm scope from `@aio-commerce-sdk/iacly` to `@adobe/aio-commerce-lib-iacly` (or the agreed name).
3. Set `"private": false`.
4. Add `publishConfig.exports` with `dist/` paths.
5. Add a `tsdown.config.ts` extending `baseConfig`.
6. Add a `build` script.
7. Run `pnpm changeset add` and follow the changeset conventions in the root `AGENTS.md`.
