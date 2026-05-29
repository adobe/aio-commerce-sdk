# `@adobe/aio-commerce-lib-app` Package

## REST Endpoints

The runtime actions under `source/actions/` expose REST endpoints. Their public contract is documented in `docs/openapi.json`, which is served at runtime via `GET /app-config/openapi.json` and linted by Redocly.

### Keeping `docs/openapi.json` in sync

`docs/openapi.json` is maintained by hand. Whenever you add, remove, or change a route in `source/actions/`, you **MUST** update it in the same PR. Stale spec is treated the same as stale documentation.

- `info.version` is synced automatically — do not edit it by hand. It is updated by the `version` lifecycle hook (called by `pnpm changeset version`).

- Run `pnpm --filter @adobe/aio-commerce-lib-app run lint:openapi` to validate the spec with Redocly before committing.

- `GET /app-config/openapi.json` strips paths based on the app's capabilities at runtime (see `source/actions/app-config/router.ts`). The spec should reflect the full set of possible paths — the stripping happens server-side, not in the file.
