# `@aio-commerce-sdk/aio-commerce-lib-iacly`

IaC providers for Adobe Commerce App Builder apps. Implements the `Provider` and `Resource`
interfaces from `@aio-commerce-sdk/iacly` for webhooks, I/O Events, Commerce Events, and Admin UI.

## Commands

```sh
pnpm --filter @aio-commerce-sdk/aio-commerce-lib-iacly test
pnpm --filter @aio-commerce-sdk/aio-commerce-lib-iacly typecheck
pnpm --filter @aio-commerce-sdk/aio-commerce-lib-iacly lint
```

## Conventions

- Same Biome + strict TypeScript config as the rest of the monorepo.
- Tests live in `test/integration/`. Fixtures (MSW handlers) in `test/fixtures/`.
- No build step — consumed from source within the workspace.
- Resource classes are internal to their provider module. Do not export them from `source/index.ts`.
- Every source file must carry the Apache 2.0 license header.
