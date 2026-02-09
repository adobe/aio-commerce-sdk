# `@adobe/aio-commerce-lib-app` Documentation

> [!WARNING]
> This package is a work in progress and is not yet ready for use. You may be able to install it, but if you do, expect breaking changes.

## Overview

The `@adobe/aio-commerce-lib-app` library provides:

- **Configuration Management**: Define, validate and read/parse configurations for Adobe Commerce applications

## Reference

See the [API Reference](./api-reference/README.md) for more details.

## How to use

### Setup

Follow these steps to integrate the app library into your Adobe Commerce App Builder application:

#### 1. Install the package

```bash
npm install @adobe/aio-commerce-lib-app
```

#### 2. Create your app configuration

Create an app config file in your project root. The library supports multiple file formats:

- `app.commerce.config.js` - JavaScript (CommonJS or ESM, depending on `type` in `package.json`)
- `app.commerce.config.ts` - TypeScript
- `app.commerce.config.cjs` - CommonJS
- `app.commerce.config.mjs` - ES Module
- `app.commerce.config.mts` - ES Module TypeScript
- `app.commerce.config.cts` - CommonJS TypeScript

**Example using ESM:**

```javascript
import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "my-commerce-app",
    displayName: "My Commerce App",
    description: "A custom Adobe Commerce application",
    version: "1.0.0",
  },
  businessConfig: {
    schema: [
      {
        name: "enableSomeFeature",
        type: "list",
        label: "Enable Some Feature",
        description: "Enable or disable a specific feature",
        selectionMode: "single",
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ],
        default: "yes",
      },
    ],
  },
});
```

**Example using CommonJS:**

```javascript
const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");

module.exports = defineConfig({
  metadata: {
    id: "my-commerce-app",
    displayName: "My Commerce App",
    description: "A custom Adobe Commerce application",
    version: "1.0.0",
  },
  // ... rest of config
});
```

The `defineConfig` helper provides type-safe configuration definition with autocompletion support in your IDE.

#### 3. Generate the app artifacts

Run the generate command to create the manifest and runtime action:

```bash
npx @adobe/aio-commerce-lib-app generate all
```

This will create:

- **Extensibility Manifest** (`src/commerce-extensibility-1/.generated/app.commerce.manifest.json`)
- **Runtime Action** (`src/commerce-extensibility-1/.generated/actions/get-app-config.js`)
- **Extension Configuration** (`src/commerce-extensibility-1/ext.config.yaml`)

#### 4. Reference the extension in your app configuration

In your `app.config.yaml` file, add the extension point reference:

```yaml
extensions:
  commerce/extensibility/1:
    $include: "src/commerce-extensibility-1/ext.config.yaml"
```

#### 5. Add the extension point to your install configuration

In your `install.yaml` file, add the extension point reference:

```yaml
extensions:
  - extensionPointId: commerce/extensibility/1
```

The generated `ext.config.yaml` file includes a `pre-app-build` hook that automatically regenerates the manifest before each build, ensuring your configuration is always up-to-date.

### Defining Configuration

The current app configuration definition (subject to change in the future) consists of two main parts: **metadata** and **businessConfig**.

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

**Validation Rules:**

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

For detailed information about available field types and their usage, see the [`@adobe/aio-commerce-lib-config` documentation](../../aio-commerce-lib-config/docs/usage.md#schema-validation).

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
          fields: ["order_id", "customer_id"],
          runtimeActions: ["my-package/handle-order"],
          description: "Triggered when an order is placed",
        },
        {
          name: "observer.catalog_update",
          fields: ["product_id"],
          runtimeActions: ["my-package/sync-catalog"],
          description: "Triggered when catalog is updated",
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

**Commerce Events:**

- **name**: Must start with `plugin.` or `observer.` followed by lowercase letters and underscores (e.g., `plugin.order_placed`, `observer.catalog_update`)
- **fields**: Array of field names (lowercase alphanumeric with underscores)
- **runtimeActions**: Array of runtime actions to invoke when the event is triggered, each in the format `<package>/<action>` (e.g., `["my-package/my-action"]`). Multiple actions can be specified to handle the same event.
- **description**: Description of the event (max 255 characters)

**External Events:**

- **name**: Lowercase alphanumeric with underscores
- **label**: Display name for the event (max 100 characters)
- **description**: Description of the event (max 255 characters)
- **runtimeActions**: Array of runtime actions to invoke when the event is triggered, each in the format `<package>/<action>` (e.g., `["my-package/my-action"]`). Multiple actions can be specified to handle the same event.

**Provider Configuration:**

- **label**: Display name for the provider (max 100 characters)
- **description**: Description of the provider (max 255 characters)
- **key**: Optional unique key for the provider (max 50 characters, alphanumeric with hyphens)

Both `commerce` and `external` arrays are optional, you can configure one, both, or neither depending on your application's needs.

#### Custom Installation Steps

The `installation.customInstallationSteps` field allows you to define custom scripts that run during the application installation process. These scripts are pre-loaded and executed in the order they are defined.

```javascript
installation: {
  customInstallationSteps: [
    {
      script: "./configure-webhooks.js",
      name: "Configure Webhooks",
      description: "Set up webhook endpoints for order notifications",
    },
    {
      script: "./initialize-database.js",
      name: "Initialize Database",
      description: "Create required database tables and indexes",
    },
  ];
}
```

**Configuration Fields:**

- **script**: Path to the script file (must end with `.js` or `.ts`). The path must be relative to the generated `app-management/installation.js` action file. For example:
  - `"./demo-success.js"` - Script in the same directory as installation.js
  - `"../../scripts/setup.js"` - Script in a parent directory
  - `"../shared/configure.js"` - Script in a sibling directory
- **name**: Display name for the installation step (max 255 characters)
- **description**: Description of what the step does (max 255 characters)

**Script Requirements:**

Your custom installation scripts must export a default function with the following signature:

```javascript
/**
 * Custom installation script
 *
 * @param {object} config - The complete commerce app configuration
 * @param {object} context - Execution context with logger and customScripts
 * @param {object} params - Additional runtime parameters
 * @returns {Promise<object>} Result data (optional)
 */
export default async function (config, context, params) {
  const { logger } = context;

  logger.info("Installation step started");

  // Your installation logic here
  // Access config: config.metadata, config.businessConfig, etc.
  // Use logger for output: logger.info(), logger.debug(), logger.error()

  logger.info("Installation step completed");

  return {
    status: "success",
    // Return any data you want to include in the installation results
  };
}
```

**Example: Successful Installation Script**

```javascript
// configure-webhooks.js (located in same directory as installation.js)

/**
 * Configures webhook endpoints for the application
 */
export default async function (config, context, params) {
  const { logger } = context;

  logger.info("Setting up webhook endpoints...");

  // Example: Use configuration to set up webhooks
  const apiKey = params.apiKey || "default-key";

  // Simulate webhook configuration
  await new Promise((resolve) => setTimeout(resolve, 500));

  logger.info("Webhook endpoints configured successfully");

  return {
    status: "success",
    message: "Webhooks configured",
    timestamp: new Date().toISOString(),
    webhooks: [
      { name: "order_placed", url: "/webhooks/orders" },
      { name: "inventory_updated", url: "/webhooks/inventory" },
    ],
  };
}
```

**Example: Script with Error Handling**

```javascript
// initialize-database.js (located in same directory as installation.js)

/**
 * Initializes database tables and indexes
 */
export default async function (config, context, params) {
  const { logger } = context;

  logger.info("Initializing database...");

  try {
    // Example: Check if required configuration exists
    if (!config.businessConfig?.schema) {
      throw new Error("Business configuration schema is required");
    }

    // Simulate database initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info("Database initialized successfully");

    return {
      status: "success",
      message: "Database tables and indexes created",
      tables: ["orders", "customers", "products"],
    };
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    throw error; // Re-throw to fail the installation step
  }
}
```

**Important Notes:**

- Scripts **must** use `export default` to export the main function (named exports like `export { run }` are not supported)
- Scripts are executed **sequentially** in the order defined in the configuration
- If any script throws an error, the entire installation fails and subsequent scripts are not executed
- Scripts have access to the complete app configuration and can use it to make decisions
- Use `context.logger` for logging - it's automatically configured with appropriate log levels
- Scripts are pre-loaded and bundled with your action during the `generate actions` command
- After modifying custom installation scripts, run `npx @adobe/aio-commerce-lib-app generate actions` to regenerate the installation action

### CLI Commands

The library provides CLI commands to generate app artifacts:

```bash
# Generate all artifacts (manifest + runtime actions)
npx @adobe/aio-commerce-lib-app generate all

# Generate app manifest only
npx @adobe/aio-commerce-lib-app generate manifest

# Generate runtime actions only
npx @adobe/aio-commerce-lib-app generate actions
```

**Custom Installation Scripts:**

When you run `generate actions`, the CLI automatically:

1. Reads your `app.commerce.config.*` file
2. Finds all custom installation scripts defined in `installation.customInstallationSteps`
3. Generates static ES6 imports for each script in the installation action
4. Creates a `loadCustomInstallationScripts()` function that maps script paths to loaded modules
5. Updates the installation context to include pre-loaded scripts

This means your custom scripts are:

- **Pre-loaded** at action startup (no dynamic imports at runtime)
- **Bundled** with the installation action
- **Type-checked** (if using TypeScript)
- **Ready to execute** without file system operations

After modifying your custom installation scripts or their configuration, always run:

```bash
npx @adobe/aio-commerce-lib-app generate actions
```

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

#### Reading Bundled Configuration in Runtime Actions

The `readBundledCommerceAppConfig` function is designed for use in runtime actions to read the bundled manifest:

```javascript
import { readBundledCommerceAppConfig } from "@adobe/aio-commerce-lib-app/config";

export async function main(params) {
  try {
    // Retrieve the bundled app configuration
    const config = await readBundledCommerceAppConfig();

    // Access metadata for version-based logic
    if (config.metadata.version >= "2.0.0") {
      // Handle version 2.0.0 or higher
    } else {
      // Handle older versions for backward compatibility
    }

    return {
      statusCode: 200,
      body: config,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: { error: error.message },
    };
  }
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
