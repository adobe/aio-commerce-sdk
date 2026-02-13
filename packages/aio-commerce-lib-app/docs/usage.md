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

**Commerce Events:**

- **name**: Must start with `plugin.` or `observer.` followed by lowercase letters and underscores (e.g., `plugin.order_placed`, `observer.catalog_update`)
- **fields**: Array of field objects. Each field object must have:
  - **name** (required): The field name. Field names can contain letters (a-z, A-Z), numbers (0-9), underscores (\_), dashes (-), dots (.), and square brackets ([, ]), or be exactly `"*"` (e.g., `"name"`, `"price"`, `"_origData"`, `"*"`)
  - **source** (optional): A string value for the field source (e.g., `"catalog"`, `"order"`)
- **rules**: Optional array of filtering rules. Each rule must have:
  - **field**: The field name to filter on
  - **operator**: The comparison operator (e.g., `"lessThan"`, `"greaterThan"`, `"equals"`)
  - **value**: The value to compare against
- **runtimeActions**: Array of runtime actions to invoke when the event is triggered, each in the format `<package>/<action>` (e.g., `["my-package/my-action"]`). Multiple actions can be specified to handle the same event.
- **description**: Description of the event (max 255 characters)

> [!NOTE]
> When using `rules` with PaaS, the minimum version of `magento/commerce-eventing` must be 1.17.
> If `rules` is provided, `parent` must also be provided

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

#### Custom Installation Process

The `installation` field allows you to configure custom scripts and messages for the application installation process.

##### Installation Messages

You can define messages that will be displayed to users before and after the installation process:

```javascript
installation: {
  messages: {
    "preInstallation": "This App requires configuration A & B to be completed before clicking Install.",
    "postInstallation": "Configure your email settings to complete the setup.",
  },
}
```

**Message Fields:**

- **preInstallation** (optional): Message displayed to users before installation starts (max 1000 characters)
- **postInstallation** (optional): Message displayed to users after installation completes (max 1000 characters)

Both message fields are optional. You can provide one, both, or neither depending on your needs.

#### Custom Installation Steps

The `installation.customInstallationSteps` field allows you to define custom scripts that run during the application installation process. These scripts are pre-loaded and executed in the order they are defined.

```javascript
installation: {
  preInstallation: "Please ensure all prerequisites are met before installation.",
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

**Configuration Fields:**

- **script**: Path to the `.js` script file **relative to your project root**. For example:
  - `"./scripts/setup.js"` - Script in a `scripts` folder at project root
  - `"./src/installation/configure.js"` - Script in a nested directory
  - `"./setup.js"` - Script at project root

  The build process will automatically resolve these paths to the correct relative imports in the generated installation action.

- **name**: Display name for the installation step (max 255 characters)
- **description**: Description of what the step does (max 255 characters)

**Script Requirements:**

Your custom installation scripts must export a default function with the following signature:

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

**Example: Successful Installation Script**

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

**Example: Script with Error Handling**

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

**Important Notes:**

- Scripts **must** use `export default` to export the main function (named exports like `export { run }` are not supported)
- Scripts are executed **sequentially** in the order defined in the configuration
- If any script throws an error, the entire installation fails and subsequent scripts are not executed
- Scripts have access to the complete app configuration and can use it to make decisions

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
