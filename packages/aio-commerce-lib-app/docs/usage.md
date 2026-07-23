# `@adobe/aio-commerce-lib-app` Documentation

## Overview

The `@adobe/aio-commerce-lib-app` library provides:

- **App Configuration**: Define, validate and read/parse configurations for Adobe Commerce App Builder applications
- **Business Configuration**: Generate and manage the runtime actions that power the `commerce/configuration/1` extension point.
- **Installation Management**: Generate and manage the runtime action that powers the app installation flow.
- **Admin UI Configuration** (`commerce/backend-ui/2`): Generate and manage the runtime action and `workerProcess` declarations for Admin UI extensions on `commerce/backend-ui/2`. Currently supports grid column extensions, mass actions, order view buttons, and menu declarations.
- **Association Helpers**: Retrieve the Commerce instance the app is associated with from any runtime action via `getCommerceClient` and `getCommerceInstance`.
- **Event Emission**: Publish a configured I/O Event from any runtime action by provider key and event name via `publishEvent`.
- **Event Code Resolution**: Compute the I/O Events event code for a declared event via `resolveIoEventCode`, matching the prefixing rules used at installation time.

## Reference

See the [API Reference](./api-reference/README.md) for more details.

## How to use

### Setup

#### Recommended: Quick Setup

The fastest way to get started is using the `init` command, which automates the entire setup process:

```bash
npx @adobe/aio-commerce-lib-app init
```

The `init` command will:

- Create `app.commerce.config.*` with a template (prompts you to choose format and features if the file doesn't exist)
- Install required dependencies (`@adobe/aio-commerce-lib-app`, `@adobe/aio-commerce-sdk`, and `@adobe/aio-commerce-lib-config` when business configuration is enabled)
- Add the `postinstall` hook to your `package.json`
- Generate all required artifacts (`commerce/configuration/1` resources are only generated when `businessConfig` is defined in your config)
- Update your `app.config.yaml` and `install.yaml` with the appropriate extension references, including `commerce/configuration/1` only when applicable

The command automatically detects your package manager (npm, pnpm, yarn, or bun) by checking for lock files and uses the appropriate commands.

After running `init`, you'll need to:

1. Review and customize `app.commerce.config.*` with your app details
2. Build and deploy your app

#### Alternative: Manual Setup

If you need more control over the process:

1. Install the package and the required SDK peer dependency:

```bash
npm install @adobe/aio-commerce-lib-app @adobe/aio-commerce-sdk
```

> [!IMPORTANT]
> The generated runtime actions require `@adobe/aio-commerce-sdk` at runtime. Make sure it is installed before deploying your application.

Add a `postinstall` hook to your `package.json` to ensure that everything keeps running as expected after each install.

```json
{
  "scripts": {
    "postinstall": "npx aio-commerce-lib-app hooks postinstall"
  }
}
```

2. Create your app configuration file at your project root. The library supports multiple file formats:

- `app.commerce.config.js` - JavaScript (CommonJS or ESM, depending on `type` in `package.json`)
- `app.commerce.config.ts` - TypeScript
- `app.commerce.config.cjs` - CommonJS
- `app.commerce.config.mjs` - ES Module
- `app.commerce.config.mts` - ES Module TypeScript
- `app.commerce.config.cts` - CommonJS TypeScript

See [Defining Configuration](#defining-configuration) for all available fields and examples.

3. Generate all required artifacts:

```bash
npx @adobe/aio-commerce-lib-app generate all
```

This produces the following files, organized by extension point:

**`commerce/extensibility/1`**: App management:

- `src/commerce-extensibility-1/.generated/app.commerce.manifest.json`: a validated JSON representation of your app config
- `src/commerce-extensibility-1/.generated/actions/app-management/app-config.js`: serves the app configuration to the App Management UI
- `src/commerce-extensibility-1/.generated/actions/app-management/installation.js`: drives the installation flow, including any custom scripts you define
- `src/commerce-extensibility-1/ext.config.yaml`: extension manifest with the `pre-app-build` hook

Generated application code should import app metadata from `#app.commerce.config`. The alias can be used to import the config's default export, as well as any other symbols exported from your `app.commerce.config.*` file.

**`commerce/configuration/1`**: Business configuration (generated when `businessConfig` is defined):

- `src/commerce-configuration-1/.generated/configuration-schema.json`: a validated JSON representation of your schema, generated for static schemas
- `src/commerce-configuration-1/.generated/actions/business-configuration/config.js`: handles retrieving and updating configuration values across scopes
- `src/commerce-configuration-1/.generated/actions/business-configuration/scope-tree.js`: handles scope hierarchy management for both Adobe Commerce and custom external scopes
- `src/commerce-configuration-1/ext.config.yaml`: extension manifest with the `pre-app-build` hook

> [!NOTE]
> Generated actions import app config through `#app.commerce.config`. When the business config schema contains `dynamicList` fields, no separate `configuration-schema.json` is generated. Generated actions resolve `dynamicList` fields on every request. Any external credentials a factory uses must be declared as `inputs` for each action that resolves the schema (in the corresponding `ext.config.yaml` of each action).

**`commerce/backend-ui/2`**: Admin UI registration (generated when `adminUi` is defined):

- `src/commerce-backend-ui-2/ext.config.yaml`: extension manifest with the `pre-app-build` hook and `workerProcess` declarations derived from `runtimeAction` values
- `src/commerce-backend-ui-2/web-src/`: browser scaffold generated when iframe-based Admin UI features require a `view` operation. Existing `web-src/index.html` files are never overwritten.

> [!NOTE]
> Generated actions default to the `nodejs:24` runtime. To pin a different runtime, set the `runtime` field on the action in the generated `ext.config.yaml`. Codegen preserves a `runtime` you set there, so it survives regeneration.

4. In your `app.config.yaml`, reference the generated extension configurations. If you have multiple extension points, add each as a new entry:

```yaml
extensions:
  commerce/extensibility/1:
    $include: "src/commerce-extensibility-1/ext.config.yaml"
  # Only include this if businessConfig is defined in your app.commerce.config.*:
  commerce/configuration/1:
    $include: "src/commerce-configuration-1/ext.config.yaml"
  # Only include this if adminUi is defined in your app.commerce.config.*:
  commerce/backend-ui/2:
    $include: "src/commerce-backend-ui-2/ext.config.yaml"
```

5. In your `install.yaml`, add the extension point references. If you have multiple extension points, add each as a new entry:

```yaml
extensions:
  - extensionPointId: commerce/extensibility/1
  # Only include this if businessConfig is defined in your app.commerce.config.*:
  - extensionPointId: commerce/configuration/1
  # Only include this if adminUi is defined in your app.commerce.config.*:
  - extensionPointId: commerce/backend-ui/2
```

### Defining Configuration

The current app configuration definition contains the following sections:

- **metadata**: Application metadata
- **businessConfig**: Business configuration schema
- **eventing**: Eventing configuration
- **installation**: Installation configuration
- **adminUi**: Admin UI registration on `commerce/backend-ui/2`

#### Application Metadata

Application metadata is required and identifies your application:

```typescript
{
  metadata: {
    id: "my-commerce-app",
    displayName: "My Commerce App",
    version: "1.0.0",

    description: "A custom Adobe Commerce application for XYZ purpose",
  }
}
```

##### Validation Rules:

- **id**: Must contain only alphanumeric characters and dashes
- **displayName**: Maximum 50 characters
- **description**: Maximum 255 characters
- **version**: Must follow semantic versioning format (e.g., `1.0.0`, `2.1.3`)

#### Business Configuration Schema

The `businessConfig.schema` field defines the configuration parameters for your application:

```javascript
businessConfig: {
  schema: [
    {
      name: 'apiKey',
      type: 'text',
      label: 'API Key',
      description: 'Your API key for the service',
    },
    {
      name: 'environment',
      type: 'list',
      label: 'Environment',
      selectionMode: 'single',
      options: [
        { label: 'Production', value: 'prod' },
        { label: 'Sandbox', value: 'sandbox' },
      ],
      default: 'sandbox',
    },
  ],
}
```

For detailed information about available field types and their usage, see the [`@adobe/aio-commerce-lib-config` documentation](../../aio-commerce-lib-config/docs/usage.md#field-types).

#### Eventing Configuration

The `eventing` field allows you to configure event sources for your application. There are two types of event sources: **commerce** (for Adobe Commerce events) and **external** (for third-party events).

```javascript
eventing: {
  commerce: [
    {
      provider: {
        label: "My Commerce Events",
        description: "Events from Adobe Commerce",
        key: "my-commerce-provider", // optional
      },
      events: [
        {
          name: "plugin.order_placed",
          fields: [
            { name: "order_id" },
            { name: "customer_id" },
          ],
          runtimeActions: ["my-package/handle-order"],
          description: "Triggered when an order is placed",
        },
        {
          name: "observer.catalog_update",
          fields: [
            { name: "product_id", source: "catalog" },
          ],
          runtimeActions: ["my-package/sync-catalog"],
          description: "Triggered when catalog is updated",
        },
        {
          name: "observer.catalog_product_save_after",
          fields: [
            { name: "price" },
            { name: "_origData" },
            { name: "quoteId" , source: "context_checkout_session.get_quote.get_id" },
          ],
          rules: [
            {
              field: "price",
              operator: "lessThan",
              value: "300.00",
            },
          ],
          runtimeActions: ["my-package/handle-product"],
          description: "Triggered when a product is saved with price filter",
        },
      ],
    },
  ],
  external: [
    {
      provider: {
        label: "External Events Provider",
        description: "Events from third-party services",
      },
      events: [
        {
          name: "webhook_received",
          label: "Webhook Received",
          description: "Triggered when a webhook is received",
          runtimeActions: ["my-package/handle-webhook"],
        },
        {
          name: "external_notification",
          label: "External Notification",
          description: "Triggered by external notification",
          runtimeActions: ["my-package/handle-notification"],
        },
      ],
    },
  ],
}
```

##### Commerce Events:

- **name**: Must start with `plugin.` or `observer.` followed by lowercase letters and underscores (e.g., `plugin.order_placed`, `observer.catalog_update`)
- **label**: Display name for the event (max 100 characters)
- **description**: Description of the event (max 255 characters)
- **fields**: Array of field objects. Each field object must have:
  - **name** (required): The field name.
  - **source** (optional): A string value for the field source (e.g., `"catalog"`, `"order"`)
- **rules**: Optional array of filtering rules. Each rule must have:
  - **field**: The field name to filter on
  - **operator**: The comparison operator. Valid values: `"greaterThan"`, `"lessThan"`, `"equal"`, `"regex"`, `"in"`, `"onChange"`
  - **value**: The value to compare against
- **destination**: Optional destination for the event. Must be a valid destination name.
- **prioritary**: Optional boolean value to indicate if the event is prioritary.
- **force**: Optional boolean value to indicate if the event should be forced.
- **runtimeActions**: Array of runtime actions to invoke when the event is triggered, each in the format `<package>/<action>` (e.g., `["my-package/my-action"]`). Multiple actions can be specified to handle the same event.
- **env**: Optional array of Commerce environments the event applies to. See [Environment Scoping (Events)](#environment-scoping-events).

##### External Events:

- **name**: Word characters (letters, digits, underscore), hyphens, underscores, and dots (e.g., `external_event`, `webhook.received`, `my-event_123`)
- **label**: Display name for the event (max 100 characters)
- **description**: Description of the event (max 255 characters)
- **runtimeActions**: Array of runtime actions to invoke when the event is triggered, each in the format `<package>/<action>` (e.g., `["my-package/my-action"]`). Multiple actions can be specified to handle the same event.
- **env**: Optional array of Commerce environments the event applies to. See [Environment Scoping (Events)](#environment-scoping-events).

##### Provider Configuration:

- **label**: Display name for the provider (max 100 characters)
- **description**: Description of the provider (max 255 characters)
- **key**: Optional unique key for the provider (max 50 characters, alphanumeric with hyphens)

Both `commerce` and `external` arrays are optional, you can configure one, both, or neither depending on your application's needs.

##### Environment Scoping (Events)

Each event accepts an optional `env` property to scope it to specific Commerce environments. The value is an array of environments (`"paas"`, `"saas"`) and accepts any combination of one or more. This mirrors the [environment scoping available for Business Configuration fields](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-config/docs/usage.md#conditional-fields-by-commerce-environment).

When `env` is omitted, the event applies to all Commerce environments. When `env` is set, the event is only created at install time on the listed environments. If every event in a provider is scoped to environments that do not match the target, the whole provider is skipped: no I/O Events provider is created, and no registration is made.

```javascript
eventing: {
  commerce: [
    {
      provider: { label: "Orders", description: "Order events" },
      events: [
        {
          name: "observer.sales_order_place_after",
          description: "Triggered when an order is placed",
          runtimeActions: ["my-package/on-order"],
          fields: [{ name: "increment_id" }],
          env: ["saas"], // only created on SaaS instances
        },
        {
          name: "observer.catalog_product_save_after",
          description: "Triggered when a product is saved",
          runtimeActions: ["my-package/on-product"],
          fields: [{ name: "sku" }],
          // No `env` -> applies to all Commerce environments
        },
      ],
    },
  ],
}
```

An empty `env` array is rejected at validation time, as is any value other than `"paas"` or `"saas"`.

#### Webhooks Configuration

The `webhooks` field allows you to register [Adobe Commerce webhooks](https://developer.adobe.com/commerce/extensibility/webhooks/) for your application. Each webhook entry either resolves its target URL from a runtime action (`runtimeAction`) or provides an explicit `url` inside the `webhook` object.

```javascript
webhooks: [
  {
    label: "Validate stock",
    description: "Inventory check before order placement.",
    runtimeAction: "my-package/validate-stock",
    webhook: {
      webhook_method: "observer",
      webhook_type: "before",
      batch_name: "stock",
      hook_name: "validate",
      method: "POST",
    },
  },
  {
    label: "Audit log",
    description: "Posts to an external audit endpoint.",
    webhook: {
      webhook_method: "observer",
      webhook_type: "after",
      batch_name: "audit",
      hook_name: "log",
      method: "POST",
      url: "https://example.com/audit",
    },
  },
];
```

Each webhook entry supports:

- **label**: Display name for the webhook.
- **description**: Description of what the webhook does.
- **category**: Optional conflict-detection category. One of `"validation"`, `"append"`, `"modification"`.
- **runtimeAction**: The runtime action that resolves the webhook URL, in the format `<package>/<action>`. The SDK derives the public action URL at install time and injects it into the webhook payload. **Mutually exclusive with `webhook.url`** — use one or the other, never both.
- **requireAdobeAuth**: Optional boolean (runtime-action webhooks only). When not `false`, the webhook is registered with Adobe OAuth credentials.
- **webhook**: The webhook payload sent to Commerce (`webhook_method`, `webhook_type`, `batch_name`, `hook_name`, `method`, and optional `url`, `fields`, `rules`, `headers`, `priority`, `required`, timeouts, and `ttl`). When `runtimeAction` is omitted, `webhook.url` is required and must be an explicit HTTPS URL pointing to your handler endpoint.
- **env**: Optional array of Commerce environments the webhook applies to. See [Environment Scoping (Webhooks)](#environment-scoping-webhooks).

##### `runtimeAction` vs `webhook.url`

These two properties are the mutually exclusive ways to specify where Commerce sends the webhook request:

- **`runtimeAction`** — use this when the handler lives inside your App Builder app. Provide the action path (`<package>/<action>`), and the SDK resolves the public Runtime URL automatically at install time. This is the recommended approach for logic you own and deploy alongside the app.

- **`webhook.url`** — use this when the handler is an external endpoint: a third-party service, a middleware platform, or any HTTPS URL outside of App Builder. The URL is passed to Commerce as-is; the SDK does not validate or modify it.

##### Environment Scoping (Webhooks)

Like events, each webhook entry accepts an optional `env` property (`"paas"`, `"saas"`) to scope it to specific Commerce environments. When omitted, the webhook applies to all environments; when set, it is only subscribed at install time on the listed environments.

```javascript
webhooks: [
  {
    label: "Validate stock on PaaS",
    description: "Inventory check that only exists on Adobe Commerce (PaaS).",
    runtimeAction: "my-package/validate-stock",
    env: ["paas"], // only subscribed on PaaS instances
    webhook: {
      webhook_method: "observer",
      webhook_type: "before",
      batch_name: "stock",
      hook_name: "validate",
      method: "POST",
    },
  },
  {
    label: "Audit log",
    description: "Applies to every environment (no env declared).",
    runtimeAction: "my-package/audit",
    webhook: {
      webhook_method: "observer",
      webhook_type: "after",
      batch_name: "audit",
      hook_name: "log",
      method: "POST",
    },
  },
];
```

An empty `env` array is rejected at validation time, as is any value other than `"paas"` or `"saas"`.

#### Custom Installation Process

The `installation` field allows you to configure custom scripts and messages for the application installation process.

##### Installation Messages

You can define messages that will be displayed to users before and after the installation process:

```javascript
installation: {
  messages: {
    preInstallation: "This App requires configuration A & B to be completed before clicking Install.",
    postInstallation: "Configure your email settings to complete the setup.",
  },
}
```

###### Message Fields:

- **preInstallation** (optional): Message displayed to users before installation starts (max 1000 characters)
- **postInstallation** (optional): Message displayed to users after installation completes (max 1000 characters)

Both message fields are optional. You can provide one, both, or neither depending on your needs.

##### Custom Installation Steps

The `installation.customInstallationSteps` field allows you to define custom scripts that run during the application installation process. These scripts are pre-loaded and executed in the order they are defined.

> [!IMPORTANT]
> Two custom installation steps cannot have the same name. Step names must be unique.

```javascript
installation: {
  messages: {
    preInstallation: "Please ensure all prerequisites are met before installation.",
  },

  customInstallationSteps: [
    {
      script: "./scripts/configure-webhooks.js",
      name: "Configure Webhooks",
      description: "Set up webhook endpoints for order notifications",
    },
    {
      script: "./scripts/initialize-database.js",
      name: "Initialize Database",
      description: "Create required database tables and indexes",
    },
  ];
}
```

###### Configuration Fields:

- **script**: Path to the `.js` script file **relative to your project root**. For example:
  - `"./scripts/setup.js"` - Script in a `scripts` folder at project root
  - `"./src/installation/configure.js"` - Script in a nested directory
  - `"./setup.js"` - Script at project root

  The generation process will automatically resolve these paths to the correct relative imports in the generated installation action.

- **name**: Display name for the installation step (max 255 characters)
- **description**: Description of what the step does (max 255 characters)

###### Script Requirements:

Your custom installation scripts must export a default function using the `defineCustomInstallationStep` helper (you can return anything from it):

```typescript
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";

/**
 * Custom installation script with type-safe parameters
 */
export default defineCustomInstallationStep(async (config, context) => {
  const { logger, params } = context;
  logger.info("Installation step started");

  // Your installation logic here

  logger.info("Installation step completed");
  return {
    status: "success",
    message: "Custom installation step completed",
    timestamp: new Date().toISOString(),
  };
});
```

##### Example: Successful Installation Script

```typescript
// scripts/configure-webhooks.js (at project root)
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";

/**
 * Configures webhook endpoints for the application
 */
export default defineCustomInstallationStep(async (config, context) => {
  const { logger, params } = context;
  logger.info("Setting up webhook endpoints...");

  // Access typed config properties with autocompletion
  logger.info(`Configuring webhooks for ${config.metadata.displayName}`);

  // Simulate webhook configuration
  await new Promise((resolve) => setTimeout(resolve, 500));
  logger.info("Webhook endpoints configured successfully");

  return {
    status: "success",
    message: "Webhooks configured",
    timestamp: new Date().toISOString(),
  };
});
```

##### Example: Script with Error Handling

```typescript
// scripts/initialize-database.js (at project root)
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";

/**
 * Initializes database tables and indexes
 */
export default defineCustomInstallationStep(async (config, context) => {
  const { logger } = context;
  logger.info("Initializing database...");

  try {
    // Example: Check if required configuration exists
    if (!config.businessConfig?.schema) {
      throw new Error("Business configuration schema is required");
    }

    logger.info(
      `Setting up database for ${config.metadata.displayName} v${config.metadata.version}`,
    );

    // Simulate database initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.info("Database initialized successfully");

    return {
      status: "success",
      message: "Database tables and indexes created",
      tables: ["orders", "customers", "products"],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Database initialization failed: ${errorMessage}`);
    throw error; // Re-throw to fail the installation step
  }
});
```

##### Important Notes:

- Scripts **must** use `export default` to export the main function (named exports like `export { run }` are not supported)
- Scripts are executed **sequentially** in the order defined in the configuration
- If any script throws an error, the entire installation fails and subsequent scripts are not executed
- Scripts have access to the complete app configuration and can use it to make decisions

#### Admin UI Configuration

> [!WARNING]
> **Experimental:** Admin UI support on `commerce/backend-ui/2` is not yet production-ready. The API may change in future releases.

The `adminUi` field declares Admin UI registrations for the `commerce/backend-ui/2` extension point. Unlike `commerce/backend-ui/1`, which required a dedicated registration action, V2 reads the registration directly from the `app-config` endpoint — no separate registration action is generated. Every field of `adminUi` is optional — configure only the extension points your application needs. When defined, `init` and `generate all` automatically wire up the extension, including the `pre-app-build` hook and the `workerProcess` declarations in `ext.config.yaml`.

View-based features also get a minimal `web-src/` scaffold when the resolved `view` entrypoint does not exist yet. The scaffold uses `.tsx` files when your app config is TypeScript and `.jsx` files otherwise. It imports app metadata from `#app.commerce.config`, so custom Admin UI code should use the same alias instead of importing generated files by path. Currently supported: grid column extensions, mass actions, order view buttons, and menu declarations. For details on each extension point, see the [Admin UI SDK Extension Points documentation](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/).

##### Grid Columns

The `workerProcess` entries are derived automatically from the `runtimeAction` values — you only need to provide the handler implementations.

```ts
export default defineConfig({
  adminUi: {
    order: {
      gridColumns: {
        label: "Order fulfillment data",
        description: "Adds fulfillment status and risk score to the order grid",
        runtimeAction: "orders/fetch-order-grid-data",
        columns: [
          {
            id: "fulfillment_status",
            label: "Fulfillment",
            type: "string",
            align: "left",
          },
          { id: "risk_score", label: "Risk", type: "integer", align: "right" },
        ],
      },
    },
    product: {
      gridColumns: {
        label: "Product inventory data",
        description: "Adds inventory status to the product grid",
        runtimeAction: "products/fetch-product-grid-data",
        columns: [
          {
            id: "inventory_status",
            label: "Inventory",
            type: "string",
            align: "left",
          },
        ],
      },
    },
    customer: {
      gridColumns: {
        label: "Customer loyalty data",
        description: "Adds loyalty tier to the customer grid",
        runtimeAction: "customers/fetch-customer-grid-data",
        columns: [
          {
            id: "loyalty_tier",
            label: "Loyalty Tier",
            type: "string",
            align: "left",
          },
        ],
      },
    },
  },
});
```

###### Field Reference:

- **label**: Required, non-empty string — displayed in App Management during installation
- **description**: Required, non-empty string — displayed in App Management during installation
- **runtimeAction**: Required — `<package>/<action>` path matching a handler you implement; the SDK registers it as a `workerProcess` operation automatically
- **columns**: Required array (at least one entry); each column requires:
  - **id**: non-empty string — stable column identifier, also used as the response data key
  - **label**: non-empty string — column header displayed in the grid
  - **type**: one of `"boolean"`, `"date"`, `"datetime"`, `"float"`, `"integer"`, `"string"`
  - **align**: one of `"left"`, `"center"`, `"right"`
  - **aclProtected** (optional): boolean — when `true`, Commerce generates a per-app nested ACL resource for this column in the Adobe Commerce User Roles tree, so admins can grant or deny it per role; roles without the resource don't see the column. Derive the id with `getGridColumnAclResourceId` from `@adobe/aio-commerce-lib-admin-ui/api`. See the [`@adobe/aio-commerce-lib-admin-ui` Permission Client documentation](../../aio-commerce-lib-admin-ui/docs/usage.md#permission-client).

Each of `order`, `product`, and `customer` is optional — configure only the grids your application extends.

##### Order View Buttons

`adminUi.order.viewButtons` declares buttons that appear on the order detail page in Commerce Admin. Each entry has a `type` discriminator:

- **`type: "view"`** — loads the in-app URL given by `path` inside an iframe. The SDK automatically adds a `view` operation pointing at `index.html` when at least one view button is present.
- **`type: "worker"`** — invokes the `workerProcess` operation named by `runtimeAction`, resolved by App Registry at runtime. The SDK registers the `workerProcess` entry automatically.

```javascript
adminUi: {
  order: {
    viewButtons: [
      {
        type: "view",
        id: "delete-order",
        label: "Delete",
        description: "Permanently removes the order and its associated records.",
        path: "#/delete-order",
        level: 0,
        sortOrder: 80,
        sandboxPermissions: ["allow-modals", "allow-popups"],
        confirm: { message: "Are you sure you want to delete this order?" },
      },
      {
        type: "worker",
        id: "sync-inventory",
        label: "Sync inventory",
        description: "Pushes the latest stock counts for this order's items to the ERP.",
        runtimeAction: "orders/sync-inventory",
        timeout: 15,
        level: 1,
        sortOrder: 10,
        notifications: {
          success: "Inventory synced successfully.",
          error: "Inventory sync failed. Check the runtime logs.",
        },
      },
    ],
  },
}
```

###### Field applicability by variant

| Field                | Common | `view` only | `worker` only |
| :------------------- | :----: | :---------: | :-----------: |
| `id`                 |   x    |             |               |
| `label`              |   x    |             |               |
| `level`              |   x    |             |               |
| `sortOrder`          |   x    |             |               |
| `confirm`            |   x    |             |               |
| `notifications`      |   x    |             |               |
| `path`               |        |      x      |               |
| `sandboxPermissions` |        |      x      |               |
| `runtimeAction`      |        |             |       x       |
| `timeout`            |        |             |       x       |

The `view` and `worker` variants are strict: `runtimeAction`/`timeout` on a `view` button and `path`/`sandboxPermissions` on a `worker` button are rejected at validation time.

###### Field Reference:

Shared fields (both types):

- **id**: Required — stable button identifier served to Commerce as-is
- **label**: Required — on-button text rendered in Admin
- **description**: Optional — human-readable summary exposed via `app-config` for installation tooling
- **level**: Optional — `-1`, `0`, or `1`
- **sortOrder**: Optional — positive number controlling display order
- **confirm**: Optional — `{ title?, message? }` confirmation dialog before the handler runs
- **notifications**: Optional — `{ success?, error? }` toast strings displayed after the handler returns
- **aclProtected**: Optional — boolean; when `true`, Commerce generates a per-app nested ACL resource for this button in the Adobe Commerce User Roles tree, so admins can grant or deny it per role; roles without the resource don't see the button and are blocked from invoking it. Derive the id with `getOrderViewButtonAclResourceId` from `@adobe/aio-commerce-lib-admin-ui/api`. See the [`@adobe/aio-commerce-lib-admin-ui` Permission Client documentation](../../aio-commerce-lib-admin-ui/docs/usage.md#permission-client).

`type: "view"` specific:

- **path**: Required — in-app iframe URL (e.g. `#/delete-order`)
- **sandboxPermissions**: Optional — array of `"allow-downloads"`, `"allow-modals"`, `"allow-popups"`

`type: "worker"` specific:

- **runtimeAction**: Required — `<package>/<action>` path; the SDK registers it as a `workerProcess` operation automatically
- **timeout**: Optional — positive number (seconds)

For the handler wire contract (request/response shapes), see `@adobe/aio-commerce-lib-admin-ui/order-view-buttons`.

##### Mass Actions

Mass actions are declared with an explicit `type` field that determines which variant applies:

- `type: "view"` — renders an iframe at the given `path` (optional `sandboxPermissions` attribute).
- `type: "worker"` — invokes a runtime action specified by `runtimeAction` (optional `timeout`).

The `id` field is authored as a bare name (e.g. `"export-orders"`). The SDK serves the bare `id` as-is in the `app-config` response; the Commerce backend extension handles prefixing and collision resolution when rendering the final Admin UI configuration.

For worker mass actions, `generate` automatically adds the corresponding `workerProcess` entries to the `commerce/backend-ui/2` ext.config.yaml based on the `runtimeAction` fields. The `pre-app-build` hook keeps them in sync at build time.

```yaml
# src/commerce-backend-ui-2/ext.config.yaml (auto-generated by `generate`)
operations:
  view:
    - type: web
      impl: index.html
  workerProcess:
    - type: action
      impl: my-app/archive-orders
```

###### Field applicability by variant

| Field                | Common | `view` only | `worker` only |
| :------------------- | :----: | :---------: | :-----------: |
| `id`                 |   x    |             |               |
| `label`              |   x    |             |               |
| `title`              |   x    |             |               |
| `confirm`            |   x    |             |               |
| `notifications`      |   x    |             |               |
| `selectionLimit`     |   x    |             |               |
| `path`               |        |      x      |               |
| `sandboxPermissions` |        |      x      |               |
| `runtimeAction`      |        |             |       x       |
| `timeout`            |        |             |       x       |

The `view` and `worker` variants are strict: `path`/`sandboxPermissions` on a `worker` action and `runtimeAction`/`timeout` on a `view` action are rejected at validation time.

When a mass action of `type: "view"` is present, the SDK automatically adds a `view` operation pointing at `index.html` to `ext.config.yaml`.

###### Field Reference:

Shared fields (both types):

- **id**: Required — stable action identifier served to Commerce as-is
- **label**: Required — action label rendered in the Admin UI
- **description**: Optional — human-readable summary exposed via `app-config` for installation tooling
- **title**: Optional — page title rendered in the iframe (view) or confirmation surface (worker)
- **confirm**: Optional — `{ title?, message? }` confirmation dialog shown before the action runs
- **notifications**: Optional — `{ success?, error? }` toast strings displayed after the action completes
- **selectionLimit**: Optional — positive number capping how many records may be selected at once
- **aclProtected**: Optional — boolean; when `true`, Commerce generates a per-app nested ACL resource for this mass action in the Adobe Commerce User Roles tree, so admins can grant or deny it per role; roles without the resource don't see the action and are blocked from invoking it. Derive the id with `getMassActionAclResourceId` from `@adobe/aio-commerce-lib-admin-ui/api`. See the [`@adobe/aio-commerce-lib-admin-ui` Permission Client documentation](../../aio-commerce-lib-admin-ui/docs/usage.md#permission-client).

`type: "view"` specific:

- **path**: Required — in-app iframe URL (e.g. `#/export-orders`)
- **sandboxPermissions**: Optional — non-empty array of one or more of `"allow-downloads"`, `"allow-modals"`, `"allow-popups"`

`type: "worker"` specific:

- **runtimeAction**: Required — `<package>/<action>` path; the SDK registers it as a `workerProcess` operation automatically
- **timeout**: Optional — positive number (seconds)

##### Menu

Declare a single Commerce Admin menu entry for the application. Similarly to mass actions of `type: "view"`, when `adminUi.menu` is present the SDK automatically adds a `view` operation pointing at `index.html` to `ext.config.yaml`.

```javascript
adminUi: {
  menu: {
    id: "approval_dashboard",
    label: "Approval Dashboard",
    description: "Review and approve purchase requests from Commerce Admin.",
    parentMenu: "catalog",
    sandboxPermissions: ["allow-popups", "allow-downloads"],
    aclProtected: true,
  },
}
```

###### Field Reference:

- **id**: Required — app-local menu identifier; allowed characters: `a-z`, `A-Z`, `0-9`, `/`, `:`, `_`
- **label**: Required, non-empty string — menu label rendered in Commerce Admin
- **description**: Required, non-empty string — summary shown in installation and permission-review surfaces
- **pageTitle** (optional): non-empty string — page title for the menu entry
- **parentMenu** (optional): existing Commerce menu ID under which the app menu is attached; when omitted, a per-app section is generated automatically from the information in the `metadata`. Use the named constants from `@adobe/aio-commerce-lib-admin-ui/menu` instead of raw strings:

  ```typescript
  import { MENU_SALES } from "@adobe/aio-commerce-lib-admin-ui/menu";

  export default defineConfig({
    adminUi: {
      menu: {
        id: "approval_dashboard",
        label: "Approval Dashboard",
        description: "Review and approve purchase requests.",
        parentMenu: MENU_SALES,
      },
    },
  });
  ```

- **sandboxPermissions** (optional): array of iframe sandbox permissions; allowed values: `"allow-downloads"`, `"allow-modals"`, `"allow-popups"`
- **aclProtected** (optional): boolean — when `true`, Commerce auto-generates a per-app ACL resource id from `metadata.id` and registers it in the Adobe Commerce User Roles permission tree. Admins can then grant or deny access to the app's menu on a per-role basis; users without the resource see neither the menu item nor its content.

  The generated resource id follows the pattern `Magento_CommerceBackendUix::adminuisdk_app_<sanitized-id>`, where `<sanitized-id>` is `metadata.id` lowercased with non-alphanumeric characters replaced by `_`. Use `getAclResourceId` from `@adobe/aio-commerce-lib-admin-ui/api` to derive it programmatically, and `getAdminUiPermissionClient` to check access from your runtime actions. See the [`@adobe/aio-commerce-lib-admin-ui` Permission Client documentation](../../aio-commerce-lib-admin-ui/docs/usage.md#permission-client) for details.

  ```typescript
  import {
    getAclResourceId,
    getAdminUiPermissionClient,
  } from "@adobe/aio-commerce-lib-admin-ui/api";

  // Derive the resource id from metadata.id:
  getAclResourceId("acme-promotions");
  // → "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions"

  // Check access in a runtime action:
  const client = getAdminUiPermissionClient({
    httpClient,
    appId: "acme-promotions",
  });
  const allowed = await client.check(); // uses appId to resolve the resource id
  ```

### CLI Commands

The library provides the following CLI commands:

```bash
# Initialize the project (recommended for first-time setup)
npx @adobe/aio-commerce-lib-app init

# Generate all artifacts (manifest + schema + runtime actions)
npx @adobe/aio-commerce-lib-app generate all

# Or generate individually:
npx @adobe/aio-commerce-lib-app generate manifest
npx @adobe/aio-commerce-lib-app generate actions
npx @adobe/aio-commerce-lib-app generate schema
```

##### Custom Installation Scripts:

When you run `generate actions`, the CLI automatically:

1. Reads your `app.commerce.config.*` file
2. Finds all custom installation scripts defined in `installation.customInstallationSteps`
3. Appends them to the generated `installation` action.

This ensures your installation action includes the latest script imports and configuration.

### Using the Configuration API

The library provides functions for reading, parsing, and validating app configurations. These are primarily used in build scripts and CLI tools.

#### Reading Configuration in Scripts

Use `parseCommerceAppConfig` to read and validate the configuration file in your build scripts or CLI tools:

```javascript
import { parseCommerceAppConfig } from "@adobe/aio-commerce-lib-app/config";

try {
  const config = await parseCommerceAppConfig();

  console.log(`App: ${config.metadata.displayName}`);
  console.log(`Version: ${config.metadata.version}`);

  // Access business config schema
  const schema = config.businessConfig.schema;
  console.log(`Configuration fields: ${schema.length}`);
} catch (error) {
  console.error("Configuration error:", error);
  process.exit(1);
}
```

#### Validating Configuration

You can validate configuration programmatically in your scripts:

```typescript
import {
  validateCommerceAppConfig,
  validateCommerceAppConfigDomain,
} from "@adobe/aio-commerce-lib-app/config";

try {
  // Validate the entire configuration
  const validatedConfig = validateCommerceAppConfig(myConfig);

  // Validate a specific domain (e.g., 'metadata', 'businessConfig')
  const validatedMetadata = validateCommerceAppConfigDomain(
    myConfig.metadata,
    "metadata",
  );

  console.log("Configuration is valid!");
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

### Accessing the Associated Commerce Instance from Runtime Actions

After an app is associated with a Commerce instance via App Management, the SDK stores the Commerce base URL and deployment type (`saas` or `paas`) so any runtime action can retrieve them — without custom storage setup or threading parameters through every layer of the call stack.

Two helpers are exposed from the root entrypoint:

- `getCommerceClient(auth, fetchOptions?)` — returns a ready-to-use [`AdobeCommerceHttpClient`](../../aio-commerce-lib-api/docs/usage.md). Use this when you need to call the Commerce API. The base URL and flavor come from the stored association data; you supply the resolved IMS auth. App Management requires IMS, so this accepts only IMS auth: resolve params with `resolveImsAuthParams`, or pass an `ImsAuthProvider` built with `getImsAuthProvider` / `forwardImsAuthProvider` from [`@adobe/aio-commerce-lib-auth`](../../aio-commerce-lib-auth/docs/usage.md). The optional [`fetchOptions`](https://github.com/sindresorhus/ky#options) (ky's `Options`) are forwarded to the underlying client (e.g. `headers`, `timeout`, `retry`); see [Custom Fetch Options](../../aio-commerce-lib-api/docs/usage.md#custom-fetch-options).
- `getCommerceInstance()` — returns the raw `{ baseUrl, env }`. Use this when you only need the metadata (e.g. for logging or building a custom client).

Both helpers throw `AssociationRecordNotFoundError` if the app is not currently associated, was unassociated, or was associated by an older SDK that did not store this data. Re-associating the app resolves the error.

#### Primary pattern — get a ready-to-use client

```ts
import { getCommerceClient } from "@adobe/aio-commerce-lib-app";
import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";

export async function main(params) {
  const client = await getCommerceClient(resolveImsAuthParams(params));
  const products = await client.get("products").json();
}
```

#### Low-level pattern — get the raw instance data

```ts
import { getCommerceInstance } from "@adobe/aio-commerce-lib-app";

export async function main() {
  const instance = await getCommerceInstance();

  // instance.baseUrl — Commerce API base URL
  // instance.env     — "saas" | "paas"
}
```

#### Handling the unassociated state

If your action needs to gracefully handle the case where the app is not associated yet, wrap the call in `try/catch`:

```ts
import { badRequest, ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  AssociationRecordNotFoundError,
  getCommerceClient,
} from "@adobe/aio-commerce-lib-app";
import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";

export async function main(params) {
  try {
    const client = await getCommerceClient(resolveImsAuthParams(params));
    return ok({ body: await client.get("products").json() });
  } catch (error) {
    if (error instanceof AssociationRecordNotFoundError) {
      return badRequest({
        body: { message: "App is not associated with a Commerce instance." },
      });
    }
    throw error;
  }
}
```

The data is managed automatically by the SDK during the app association lifecycle: a standalone `association` runtime action (always deployed alongside `app-config`) stores it on association and clears it on unassociation. Apps scaffolded with a version of the SDK that includes this feature have the `association` action wired in from the start — no extra setup beyond your normal deploy.

#### Adopting association in an existing app

Apps scaffolded before this feature was introduced do not have the `association` action yet. After upgrading `@adobe/aio-commerce-lib-app`, regenerate the runtime actions and redeploy so the `/association` endpoint exists:

```bash
npx @adobe/aio-commerce-lib-app generate actions
aio app deploy
```

A plain `aio app deploy` on its own does not add the action: the `pre-app-build` hook only regenerates actions already declared in `ext.config.yaml`. Only `generate actions` (or `generate all`) rebuilds the manifest to pick up newly added SDK actions. Until the app is redeployed with the endpoint, the App Management client skips the store call and the helpers throw `AssociationRecordNotFoundError`.

For an app that was already associated under the older SDK, re-associate it after redeploying so the store call runs and backfills the instance data — a redeploy alone does not populate data for an existing association.

### Emitting Configured Events from Runtime Actions

Runtime actions can publish a custom I/O Event by referencing the provider and event exactly as declared in the `eventing` section of `app.commerce.config.ts`. At installation time, the SDK writes each configured provider's I/O Events ID and event codes to system storage. `publishEvent` resolves those automatically by the given key and publishes the event.

`publishEvent(params)` takes:

- `client` — an [`AdobeIoEventsApiClient`](../../aio-commerce-lib-events/docs/usage.md) created with the IMS auth to use for the ingress call.
- `provider` — the `key` of an event provider declared in `app.commerce.config.ts`.
- `event` — the `name` of an event declared under that provider.
- `payload` — the event payload; any JSON object. The SDK wraps it in a CloudEvents 1.0 envelope before sending.

Given this configuration:

```ts
eventing: {
  external: [
    {
      provider: {
        key: "order-events",
        label: "Order Events",
        description: "Events related to order lifecycle",
      },
      events: [
        {
          name: "order.created",
          label: "Order Created",
          description: "Triggered when a new order is placed",
        },
      ],
    },
  ],
}
```

a runtime action emits the event like this:

```ts
import { publishEvent } from "@adobe/aio-commerce-lib-app";
import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events";
import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";

export async function main(params) {
  const client = createAdobeIoEventsApiClient({
    auth: resolveImsAuthParams(params),
  });

  await publishEvent({
    client,
    provider: "order-events",
    event: "order.created",
    payload: { orderId: "100000123", total: 149.99 },
  });
}
```

`publishEvent` validates the reference before sending and throws when it cannot be resolved. All three errors extend `PublishEventError`, so you can catch them individually or with a single clause:

- `EventsDataNotInitializedError` — no eventing metadata is in system storage. The app installation has not run, or ran with an older SDK. Re-run the installation to initialize it.
- `ProviderNotFoundError` — the `provider` key does not match any provider in the configuration.
- `EventNotFoundError` — the `event` name does not match any event under the given provider.

```ts
import {
  EventNotFoundError,
  EventsDataNotInitializedError,
  ProviderNotFoundError,
  PublishEventError,
  publishEvent,
} from "@adobe/aio-commerce-lib-app";

try {
  await publishEvent({ client, provider, event, payload });
} catch (error) {
  if (error instanceof PublishEventError) {
    // Handle any publish-event failure (or narrow with the specific subclasses).
  }
  throw error;
}
```

### Resolving an Event's I/O Events Code

`resolveIoEventCode(appId, eventName, providerType)` computes an event code matching the prefixing rules used at installation time (and that `publishEvent` sends). This is useful when a caller needs to know an event's code ahead of time, e.g. to match it against an incoming I/O Event.

- `appId` — the application's `metadata.id`, as declared in `app.commerce.config.ts`.
- `eventName` — the `name` of the event, as declared in `app.commerce.config.ts`.
- `providerType` — `"commerce"` or `"external"`, matching the section the event is declared under.

```ts
import { resolveIoEventCode } from "@adobe/aio-commerce-lib-app";

resolveIoEventCode("my-app", "observer.order_placed", "commerce");
// => "com.adobe.commerce.my_app.observer.order_placed"

resolveIoEventCode("my-app", "webhook.received", "external");
// => "my_app.webhook.received"
```

## Best Practices

1. **Use `defineConfig` for type safety** - Get autocompletion and type checking in your IDE

2. **Keep installation scripts focused** - Each custom installation script should do one thing well. Split complex setup into multiple scripts for better maintainability and error handling.

3. **Use descriptive names** - Choose clear, meaningful names for your installation steps (e.g., "Configure Webhooks" instead of "Setup Step 1").

4. **Handle errors gracefully** - Always wrap risky operations in try-catch blocks and provide meaningful error messages. Remember that throwing an error will fail the entire installation.

5. **Test your scripts** - Test installation scripts in a development environment before deploying to production. Consider creating test configurations with different scenarios.

6. **Keep scripts idempotent when possible** - If an installation is retried, your scripts should handle cases where resources may already exist.
