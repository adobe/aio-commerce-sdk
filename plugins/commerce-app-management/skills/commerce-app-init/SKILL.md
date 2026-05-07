---
name: commerce-app-init
description: >
  Scaffold a new Adobe Commerce app using the aio-commerce-sdk. Creates the base
  project structure and app.commerce.config file with metadata. Use when the user
  wants to create a new Commerce app from scratch or initialize a bare Commerce
  app project. Does not configure extensibility domains — use commerce-app-eventing,
  commerce-app-webhooks, or commerce-app-business-config for that.
license: Apache-2.0
compatibility: Requires Node.js 18+, aio CLI, and @adobe/aio-commerce-lib-app installed
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
---

# Initialize a new Commerce App

Scaffolds a bare Adobe Commerce app: initializes the project and creates a valid
`app.commerce.config.ts` with metadata only. Extensibility domains (events, webhooks,
business config) are added separately via domain skills.

## Step 1 — Initialize the project

```sh
npx @adobe/aio-commerce-lib-app init --appName my-commerce-app --configFormat ts
```

Safe to run on an existing App Builder project — if `app.commerce.config.ts` already exists and is valid, init skips creation and continues. After init:

- `app.commerce.config.ts` is created at the project root (or validated if already present)
- `@adobe/aio-commerce-sdk` and `@adobe/aio-commerce-lib-app` are installed
- A `postinstall` hook is registered in `package.json`

Use `--configFormat js` if the project is not using TypeScript.

> The `init` command also accepts a `--domains` flag, but do not use it here. Domain
> scaffolding is handled by dedicated skills to keep each concern separate and independently installable.

## Step 2 — Define metadata

Open `app.commerce.config.ts` and fill in the metadata:

```ts
import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "my-commerce-app", // alphanumeric + hyphens, max 100 chars
    displayName: "My Commerce App", // max 50 chars
    description: "...", // max 255 chars
    version: "1.0.0", // semver Major.Minor.Patch only
  },
});
```

Field constraints:

| Field         | Constraints                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`          | Alphanumeric + hyphens only, max 100 chars. Synced to `package.json` `name` on init.                                      |
| `displayName` | Free text, max 50 chars. Shown in Commerce Admin.                                                                         |
| `description` | Free text, max 255 chars.                                                                                                 |
| `version`     | `Major.Minor.Patch` integers only — e.g. `1.0.0`. No pre-release identifiers. Synced to `package.json` `version` on init. |

## Step 3 — Verify the config

Build the project to confirm everything is valid:

```sh
aio app build
```

If the config is invalid, the build fails with a detailed validation error pointing to the offending field.

## Common Issues

- **`id` validation error**: `metadata.id` accepts alphanumeric characters and hyphens only — no dots, underscores, or spaces.
- **`version` validation error**: Only numeric semver is accepted (`1.0.0`). Pre-release identifiers (`1.0.0-beta`) are not supported.
- **`defineConfig` not found**: Ensure `@adobe/aio-commerce-lib-app` is installed and imported from `@adobe/aio-commerce-lib-app/config`.

## Quality Bar

- `aio app build` completes without errors

## Chaining

Once the base app is ready, extend it with domain skills:

- `commerce-app-eventing` — manage Commerce and external event sources
- `commerce-app-webhooks` — manage webhook interception
- `commerce-app-business-config` — manage custom business configuration

## References

- [assets/app.commerce.config.ts](assets/app.commerce.config.ts) — Minimal config example
