---
name: commerce-app-eventing
description: >
  Add or modify event subscriptions in an Adobe Commerce app. Use when the user
  wants to configure Commerce events (such as order placement or catalog changes)
  or external event sources in an existing Commerce app. Requires a base app
  initialized with commerce-app-init.
license: Apache-2.0
compatibility: >
  Requires Node.js 22+, aio CLI, and @adobe/aio-commerce-lib-app.
  Requires a base app initialized with commerce-app-init.
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
---

# Configure Commerce App Eventing

Adds or modifies event sources — Commerce-native events or external events — in an existing `app.commerce.config.ts`.
Extensibility domains other than eventing (webhooks, business config) are added separately via their own skills.

## Prerequisites

Verify `app.commerce.config.ts` exists in the project root. If it doesn't, stop and invoke `commerce-app-init` first.

## Step 1 — Understand intent

Ask whether the user wants to configure Commerce events, external events, or both:

- **Commerce events** (`eventing.commerce`): events emitted by Adobe Commerce itself (e.g., order placed, product saved). Names follow `plugin.<segments>` or `observer.<segments>`.
- **External events** (`eventing.external`): events from third-party systems (e.g., ERP, CRM). Names are free-form (`[\w\-_.]+`).

For each event source, gather:

- Provider label, description, and optional key
- For each event: name, label, description, and which runtime action(s) should handle it (format: `<package>/<action>`)
- For Commerce events only: fields to extract from the event payload (empty array captures the full payload), and any optional filter rules

## Step 2 — Derive config values

Apply the following validation rules before writing the config. Surface any issues to the user before proceeding.

| Field                | Constraint                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| Commerce event name  | Starts with `plugin.` or `observer.`; each segment matches `[a-z_]+`; max 180 chars |
| External event name  | `[\w\-_.]+`; max 180 chars                                                          |
| Provider label       | Max 100 chars                                                                       |
| Provider description | Max 255 chars                                                                       |
| Provider key         | Optional; alphanumeric + hyphens only; max 50 chars                                 |
| Event label          | Max 100 chars                                                                       |
| Event description    | Max 255 chars                                                                       |
| Field name           | `[a-zA-Z0-9_\-.[\]]+` or `*`                                                        |
| Rule operator        | `greaterThan`, `lessThan`, `equal`, `regex`, `in`, or `onChange`                    |
| Runtime action       | `<package>/<action>` (e.g., `my-package/handle-order-placed`)                       |

## Step 3 — Update `app.commerce.config.ts`

Add or merge `eventing.commerce` and/or `eventing.external` into the existing config, preserving all other domains. Use [assets/eventing-config.ts](assets/eventing-config.ts) as the reference shape for both event source types.

If the config already has an `eventing` key, extend it rather than replacing it.

## Step 4 — Validate

Build the project to confirm the updated config is valid:

```sh
aio app build
```

A build failure with a validation error points directly to the offending config field.

## Common Issues

- **Commerce event name rejected**: Each segment must match `[a-z_]+` — no digits, uppercase letters, or hyphens in segments. Valid: `plugin.order_placed`. Invalid: `plugin.orderPlaced`, `plugin.order-placed`.
- **External event has `fields`**: The `fields` property is only valid on Commerce events; external events don't support it.
- **`runtimeActions` format error**: Must be `<package>/<action>`. Both parts are lowercase alphanumeric + hyphens only.
- **`defineConfig` not found**: Ensure `@adobe/aio-commerce-lib-app` is installed and `defineConfig` is imported from `@adobe/aio-commerce-lib-app/config`.
- **Build fails on missing action**: A runtime action referenced in `runtimeActions` must exist in the project. Check the action files under `actions/` and create any missing stubs.

## Quality Bar

- `aio app build` completes without errors

## Chaining

After `aio app build` passes:

- **Add webhook interception** — invoke `commerce-app-webhooks` to intercept Commerce operations
- **Add merchant settings** — invoke `commerce-app-business-config` to expose configurable settings in Commerce Admin

## References

- [assets/eventing-config.ts](assets/eventing-config.ts) — Reference config showing both Commerce and external event source shapes
