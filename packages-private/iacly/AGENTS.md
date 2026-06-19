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

## Promotion

`iacly` is intentionally kept private. `@aio-commerce-sdk/aio-commerce-lib-iacly` (the Commerce
providers package) is the public-facing library that consumers install; `iacly` is its private
dependency. Do not promote `iacly` to a public package without first aligning on a name that
does not conflict with `@adobe/aio-commerce-lib-iacly`.
