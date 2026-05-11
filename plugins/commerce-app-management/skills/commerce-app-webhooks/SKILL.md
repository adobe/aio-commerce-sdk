---
name: commerce-app-webhooks
description: >
  Add or modify webhook interceptors in an Adobe Commerce app. Use when the
  user wants to intercept Commerce operations to validate input, append data,
  or modify behavior — before or after execution. Requires a base app
  initialized with commerce-app-init.
license: Apache-2.0
compatibility: >
  Requires Node.js 22+, aio CLI, and @adobe/aio-commerce-lib-app.
  Requires a base app initialized with commerce-app-init.
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
  version: "0.0.1"
---

# Configure Commerce App Webhooks

Adds or modifies webhook interceptors in an existing `app.commerce.config.ts`.
Webhooks intercept Commerce operations — you can validate input, append data, or modify behavior before or after an operation executes.
Other extensibility domains (events, business config) are added separately via their own skills.

## Prerequisites

Verify `app.commerce.config.ts` exists in the project root. If it doesn't, stop and invoke `commerce-app-init` first.

## Step 1 — Understand intent

Ask the user what they want to intercept and how:

- **What operation**: the `webhook_method` (the Commerce operation, e.g., `plugin.magento.catalog_product.save`) and `webhook_type` (`before` or `after`)
- **How the handler is reached**: either a **runtime action** in this app (`runtimeAction: "<package>/<action>"`) or an **explicit external URL** (`webhook.url`) — these are mutually exclusive
- **Category** (optional): `validation` (block if invalid), `append` (add data), or `modification` (alter data) — used for conflict detection
- **Batch and hook identifiers**: `batch_name` groups related hooks; `hook_name` uniquely identifies this hook within the batch

## Step 2 — Derive config values

Apply the following validation rules before writing. Surface any issues to the user before proceeding.

| Field                      | Constraint                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `batch_name`               | `[a-zA-Z0-9_]+` only — no hyphens, dots, or spaces                                    |
| `hook_name`                | `[a-zA-Z0-9_]+` only — no hyphens, dots, or spaces                                    |
| `category`                 | Optional; must be `validation`, `append`, or `modification`                           |
| `runtimeAction`            | `<package>/<action>` format; mutually exclusive with `webhook.url`                    |
| `webhook.url`              | Must be a valid absolute URL (`https://...`); mutually exclusive with `runtimeAction` |
| `label`                    | Required, non-empty                                                                   |
| `description`              | Required, non-empty                                                                   |
| `method`                   | Required HTTP method (e.g., `POST`)                                                   |
| `timeout` / `soft_timeout` | Optional; positive integer (milliseconds)                                             |
| `priority` / `batch_order` | Optional; positive integer                                                            |

## Step 3 — Update `app.commerce.config.ts`

Add entries to the top-level `webhooks` array (or create it), preserving all other domains. If the config already has a `webhooks` key, append to it rather than replacing it.

Minimal examples:

```ts
// Runtime action handler (handler lives in this app)
webhooks: [
  {
    label: "Validate Product Save",
    description: "Validates product data before saving.",
    category: "validation", // optional
    runtimeAction: "my-package/validate-product", // <package>/<action>
    webhook: {
      webhook_method: "plugin.magento.catalog_product.save",
      webhook_type: "before",
      batch_name: "my_app", // [a-zA-Z0-9_]+ only
      hook_name: "validate_product", // [a-zA-Z0-9_]+ only
      method: "POST",
    },
  },
];

// URL handler (external endpoint)
webhooks: [
  {
    label: "Fraud Check",
    description: "Calls external fraud service before order placement.",
    webhook: {
      webhook_method: "plugin.magento.sales_order.place",
      webhook_type: "before",
      batch_name: "my_app",
      hook_name: "fraud_check",
      method: "POST",
      url: "https://fraud.example.com/check", // inside webhook object, not top level
    },
  },
];
```

See [assets/webhooks-config.ts](assets/webhooks-config.ts) for the full annotated reference.

## Step 4 — Validate

Build the project to confirm the updated config is valid:

```sh
aio app build
```

A build failure with a validation error points directly to the offending config field.

## Common Issues

- **`batch_name` or `hook_name` rejected**: Only `[a-zA-Z0-9_]+` is accepted — no hyphens, dots, or spaces. Use underscores as separators (`my_app`, `validate_product_save`).
- **Both `runtimeAction` and `webhook.url` set**: These are mutually exclusive — remove one. Use `runtimeAction` when the handler lives in this app; use `webhook.url` for an external endpoint.
- **`url` at wrong level**: For URL-based entries, `url` must be inside the nested `webhook` object, not at the top level alongside `label`.
- **`category` value rejected**: Must be exactly `validation`, `append`, or `modification` — no other values are accepted.
- **`defineConfig` not found**: Ensure `@adobe/aio-commerce-lib-app` is installed and `defineConfig` is imported from `@adobe/aio-commerce-lib-app/config`.

## Quality Bar

- `aio app build` completes without errors

## Chaining

After `aio app build` passes:

- **Add merchant settings** — invoke `commerce-app-business-config` to expose configurable settings in Commerce Admin
- **Add event subscriptions** — invoke `commerce-app-eventing` to subscribe to Commerce or external events

## References

- [assets/webhooks-config.ts](assets/webhooks-config.ts) — Reference config showing both runtime action and URL-based webhook entry shapes
