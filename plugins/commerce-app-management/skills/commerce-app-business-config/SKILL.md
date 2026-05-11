---
name: commerce-app-business-config
description: >
  Manage custom business configuration in an Adobe Commerce app. Use when the
  user wants to add, modify, or remove merchant-configurable settings (config
  fields, admin config, store configuration) exposed through Commerce Admin.
  Creates typed config fields (text, password, email, url, tel, boolean, list)
  in businessConfig.schema. Requires a base app initialized with commerce-app-init.
license: Apache-2.0
compatibility: >
  Requires Node.js 22+, aio CLI, and @adobe/aio-commerce-lib-app installed.
  Requires a base app initialized with commerce-app-init.
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
---

# Configure Commerce App Business Config

Adds or modifies the `businessConfig.schema` array in an existing `app.commerce.config.ts`.
Each entry in the schema defines one merchant-configurable setting that Commerce Admin will render as a UI field.
Other extensibility domains (webhooks, events) are added separately via their own skills.

## Prerequisites

Verify `app.commerce.config.ts` exists in the project root. If it doesn't, stop and invoke `commerce-app-init` first.

## Step 1 — Understand intent

For each setting the user wants to expose, gather:

- **Name** — machine identifier for the field (used as the config key read by the app at runtime)
- **Type** — one of: `list`, `text`, `password`, `email`, `url`, `tel`, `boolean`
- **Label** (optional) — human-readable label shown in Admin
- **Description** (optional) — help text shown alongside the field in Admin
- **Default value** (optional, type-dependent — see constraints in Step 2)
- For `list` fields additionally: **`selectionMode`** (`"single"` or `"multiple"`) and **`options`** (each with a `label` and `value` string)

## Step 2 — Derive config values

Apply the following per-type validation rules before writing. Surface any issues to the user before proceeding.

| Field                   | Constraint                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `name`                  | Required, non-empty string                                                                      |
| `type`                  | Required; one of `list`, `text`, `password`, `email`, `url`, `tel`, `boolean`                   |
| `label`                 | Optional string                                                                                 |
| `description`           | Optional string                                                                                 |
| `list.selectionMode`    | Required for list fields: `"single"` or `"multiple"`                                            |
| `list.options`          | Required for list fields; each option needs both `label` and `value` strings                    |
| `list/single` default   | Required; must match one of the option `value` strings (non-empty)                              |
| `list/multiple` default | Optional array of strings (defaults to `[]`); each element must match an option value           |
| `text` default          | Optional string (defaults to `""`)                                                              |
| `password` default      | Must be `""` — any non-empty default is rejected to prevent secrets in config                   |
| `email` default         | Optional; `""` or a fully valid email address                                                   |
| `url` default           | Optional; `""` or a fully valid absolute URL                                                    |
| `tel` default           | Optional; `""` or matches `/^\+?[0-9\s\-()]+$/` (digits, spaces, hyphens, parens, optional `+`) |
| `boolean` default       | Optional boolean (defaults to `false`)                                                          |

`businessConfig.schema` must contain at least one field — an empty array is rejected at build time.

## Step 3 — Update `app.commerce.config.ts`

Add (or merge into) the top-level `businessConfig.schema` array, preserving all other domains. If the config already has a `businessConfig` key, append to `businessConfig.schema` rather than replacing it.

Minimal examples:

```ts
businessConfig: {
  schema: [
    // Password (masked input — API keys, secrets)
    { name: "api_key", type: "password", label: "API Key", default: "" },

    // Single-select list
    {
      name: "region", type: "list", selectionMode: "single",
      label: "Region",
      options: [{ label: "EU", value: "eu" }, { label: "US", value: "us" }],
      default: "eu",   // required; must match an option value
    },

    // Boolean toggle
    { name: "debug_mode", type: "boolean", label: "Enable Debug Mode", default: false },
  ],
}
```

See [assets/business-config.ts](assets/business-config.ts) for the full reference showing all field types.

## Step 4 — Validate

Build the project to confirm the updated config is valid:

```sh
aio app build
```

A build failure with a validation error points directly to the offending field.

## Common Issues

- **`schema` must have at least one entry**: `businessConfig.schema` requires at least one field — an empty array is rejected.
- **`list/single` default missing**: Single-select list fields require a `default` — it can't be omitted. It must exactly match one of the option `value` strings.
- **Invalid `email` / `url` default**: Must be `""` or a fully valid value — partial values like `"user@"` or `"https://"` are rejected.
- **`defineConfig` not found**: Ensure `@adobe/aio-commerce-lib-app` is installed and `defineConfig` is imported from `@adobe/aio-commerce-lib-app/config`.

## Quality Bar

- `aio app build` completes without errors

## Chaining

After `aio app build` passes:

- **Add webhook interceptors** — invoke `commerce-app-webhooks` to intercept Commerce operations before or after they execute
- **Add event subscriptions** — invoke `commerce-app-eventing` to subscribe to Commerce or external events

## References

- [assets/business-config.ts](assets/business-config.ts) — Reference config showing all field types with inline constraint comments
