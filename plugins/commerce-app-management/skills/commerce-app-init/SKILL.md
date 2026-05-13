---
name: commerce-app-init
description: >
  Scaffold a new Adobe Commerce app using the aio-commerce-sdk. Creates the base
  project structure and app.commerce.config file with metadata. Use when the user
  wants to create a new Commerce app from scratch or initialize a bare Commerce
  app project. After scaffolding, chains to appbuilder-project-init for Developer
  Console setup (project, workspace, API subscriptions) when the user wants to deploy.
  Does not configure extensibility domains — use commerce-app-eventing,
  commerce-app-webhooks, or commerce-app-business-config for that.
license: Apache-2.0
compatibility: >
  Requires Node.js 22+, aio CLI, and @adobe/aio-commerce-lib-app.
  For Developer Console setup (project/workspace creation, API subscriptions, workspace wiring, deploy, or run),
  also requires appbuilder-project-init from adobe/skills:
  npx skills add adobe/skills --skill appbuilder-project-init -y
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
  version: "0.0.1"
---

# Initialize a new Commerce App

Scaffolds a bare Adobe Commerce app: creates `app.commerce.config.ts` with metadata,
then runs `init` to install dependencies and generate all required project files.
Extensibility domains (events, webhooks, business config) are added separately via domain skills.

## Step 1 — Create the config

Ask the user what type of Adobe Commerce backend they are targeting — this determines which services are subscribed during the Developer Console bootstrap later:

- **ACCS** (Adobe Commerce as Cloud Service) — managed SaaS
- **PaaS** (on-premise / cloud infrastructure)

Then derive values for the following fields from the user's intent, confirm, and write the file to the project root:

```ts
// app.commerce.config.ts
import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "my-commerce-app", // alphanumeric + hyphens only, max 100 chars
    displayName: "My Commerce App", // shown in App Management UI, max 50 chars
    description: "...", // max 255 chars
    version: "1.0.0", // Major.Minor.Patch only, no pre-release identifiers
  },
});
```

See [assets/app.commerce.config.ts](assets/app.commerce.config.ts) for the full annotated template.

## Step 2 — Initialize the project

Run init — it finds the existing config, validates it, and handles project setup:

```sh
npx @adobe/aio-commerce-lib-app init
```

Since `app.commerce.config.ts` already exists, init skips the interactive prompts.

### Project structure

After init, the project has two types of directories under `src/`:

- **`src/actions/`** — custom runtime actions. Register them in `app.config.yaml` under `application.runtimeManifest`. This is where all application-specific action code lives.
- **`src/commerce-extensibility-1/`** and **`src/commerce-configuration-1/`** — managed by `aio app build`. Do not add custom code here; treat them as read-only.

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

After `aio app build` passes:

1. **Bootstrap the Developer Console** — for any follow-up topic related to App Builder setup (Console project/workspace, API subscriptions, deploy, run, workspace wiring), invoke skill `appbuilder-project-init` (from `adobe/skills`). Tell it:
   - Skip the `aio app init` steps — the Commerce scaffold already exists
   - Subscribe `AdobeIOManagementAPISDK` (I/O Management API) as part of the workspace bootstrap — required for IMS credential syncing at runtime
   - **If ACCS**: after the workspace is created, `ACCS-REST-API` must also be subscribed. Run `aio console open` to open the workspace in the browser, then add it manually through the Developer Console UI. **Do not proceed until the user confirms it has been added.**

   If `appbuilder-project-init` is not installed, ask the user to install it first:

   ```sh
   npx skills add adobe/skills --skill appbuilder-project-init -y
   ```

2. **Extend with domain skills** — once the workspace is wired:
   - `commerce-app-eventing` — manage Commerce and external event sources
   - `commerce-app-webhooks` — manage webhook interception
   - `commerce-app-business-config` — manage custom business configuration

## References

- [assets/app.commerce.config.ts](assets/app.commerce.config.ts) — Minimal config template
