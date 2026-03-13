# `@adobe/aio-commerce-lib-app` Documentation

> [!WARNING]
> This package is a work in progress and is not yet ready for use. You may be able to install it, but if you do, expect breaking changes.

## Overview

The `@adobe/aio-commerce-lib-app` library provides:

- **App Configuration**: Define, validate and read/parse configurations for Adobe Commerce App Builder applications
- **Business Configuration**: Generate and manage the runtime actions that power the `commerce/configuration/1` extension point.
- **Installation Management**: Generate and manage the runtime action that powers the app installation flow.

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

**`commerce/configuration/1`**: Business configuration (generated when `businessConfig` is defined):

- `src/commerce-configuration-1/.generated/configuration-schema.json`: a validated JSON representation of your schema for runtime use
- `src/commerce-configuration-1/.generated/actions/business-configuration/config.js`: handles retrieving and updating configuration values across scopes
- `src/commerce-configuration-1/.generated/actions/business-configuration/scope-tree.js`: handles scope hierarchy management for both Adobe Commerce and custom external scopes
- `src/commerce-configuration-1/ext.config.yaml`: extension manifest with the `pre-app-build` hook

4. In your `app.config.yaml`, reference the generated extension configurations. If you have multiple extension points, add each as a new entry:

```yaml
extensions:
  commerce/extensibility/1:
    $include: "src/commerce-extensibility-1/ext.config.yaml"
  # Only include this if businessConfig is defined in your app.commerce.config.*:
  commerce/configuration/1:
    $include: "src/commerce-configuration-1/ext.config.yaml"
```

5. In your `install.yaml`, add the extension point references. If you have multiple extension points, add each as a new entry:

```yaml
extensions:
  - extensionPointId: commerce/extensibility/1
  # Only include this if businessConfig is defined in your app.commerce.config.*:
  - extensionPointId: commerce/configuration/1
```

### Defining Configuration

The current app configuration definition contains the following sections:

- **metadata**: Application metadata
- **businessConfig**: Business configuration schema
- **eventing**: Eventing configuration
- **installation**: Installation configuration

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
- **hipaaAuditRequired**: Optional boolean value to indicate if the event requires HIPAA audit.
- **prioritary**: Optional boolean value to indicate if the event is prioritary.
- **force**: Optional boolean value to indicate if the event should be forced.
- **runtimeActions**: Array of runtime actions to invoke when the event is triggered, each in the format `<package>/<action>` (e.g., `["my-package/my-action"]`). Multiple actions can be specified to handle the same event.

##### External Events:

- **name**: Word characters (letters, digits, underscore), hyphens, underscores, and dots (e.g., `external_event`, `webhook.received`, `my-event_123`)
- **label**: Display name for the event (max 100 characters)
- **description**: Description of the event (max 255 characters)
- **runtimeActions**: Array of runtime actions to invoke when the event is triggered, each in the format `<package>/<action>` (e.g., `["my-package/my-action"]`). Multiple actions can be specified to handle the same event.

##### Provider Configuration:

- **label**: Display name for the provider (max 100 characters)
- **description**: Description of the provider (max 255 characters)
- **key**: Optional unique key for the provider (max 50 characters, alphanumeric with hyphens)

Both `commerce` and `external` arrays are optional, you can configure one, both, or neither depending on your application's needs.

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

> [!IMPORTANT]
> Scripts are pre-loaded and bundled with your action during the `generate actions` command. After modifying custom installation scripts, run `npx aio-commerce-lib-app generate actions` to regenerate the `installation` action.

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

## Best Practices

1. **Use `defineConfig` for type safety** - Get autocompletion and type checking in your IDE

2. **Keep installation scripts focused** - Each custom installation script should do one thing well. Split complex setup into multiple scripts for better maintainability and error handling.

3. **Use descriptive names** - Choose clear, meaningful names for your installation steps (e.g., "Configure Webhooks" instead of "Setup Step 1").

4. **Handle errors gracefully** - Always wrap risky operations in try-catch blocks and provide meaningful error messages. Remember that throwing an error will fail the entire installation.

5. **Test your scripts** - Test installation scripts in a development environment before deploying to production. Consider creating test configurations with different scenarios.

6. **Keep scripts idempotent when possible** - If an installation is retried, your scripts should handle cases where resources may already exist.
