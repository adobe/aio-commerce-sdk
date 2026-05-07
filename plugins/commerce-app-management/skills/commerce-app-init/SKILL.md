---
name: commerce-app-init
description: >
  Scaffold a new Adobe Commerce app using the aio-commerce-sdk. Creates the base
  project structure and app.commerce.config file with metadata. Use when the user
  wants to create a new Commerce app from scratch or initialize a bare Commerce
  app project. Does not configure extensibility domains — use commerce-app-eventing,
  commerce-app-webhooks, or commerce-app-business-config for that.
license: Apache-2.0
compatibility: Requires Node.js 22+, aio CLI, and @adobe/aio-commerce-lib-app installed
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
---

# Initialize a new Commerce App

Scaffolds a bare Adobe Commerce app: creates `app.commerce.config.ts` with metadata,
then runs `init` to install dependencies and generate all required project files.
Extensibility domains (events, webhooks, business config) are added separately via domain skills.

## Step 1 — Create the config

Derive values for each field in [assets/app.commerce.config.ts](assets/app.commerce.config.ts)
from the user's intent, confirm, then copy it to the project root substituting the derived values.

## Step 2 — Initialize the project

Run init — it finds the existing config, validates it, and handles project setup:

```sh
npx @adobe/aio-commerce-lib-app init
```

Since `app.commerce.config.ts` already exists, init skips the interactive prompts.

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

- [assets/app.commerce.config.ts](assets/app.commerce.config.ts) — Minimal config template
