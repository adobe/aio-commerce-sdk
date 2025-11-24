# `@adobe/aio-commerce-lib-config` Documentation

## Overview

The `@adobe/aio-commerce-lib-config` library provides:

- **Configuration Management**: Read and write configuration values across hierarchical scopes
- **Scope Trees**: Support for Adobe Commerce and external system scope hierarchies
- **Inheritance Model**: Automatic configuration inheritance from parent scopes
- **Schema Validation**: Validate configuration schemas
- **App Management Integration**: Auto-generated runtime actions for the App Management UI
- **Persistent Storage**: Uses `@adobe/aio-lib-state` and `@adobe/aio-lib-files` for caching and storage

## Reference

See the [API Reference](./api-reference/README.md) for a full list of classes, interfaces, and functions exported by the library.

## Quick Start

The fastest way to get started is using the `init` command:

```bash
npx @adobe/aio-commerce-lib-config init
```

This single command will set up everything you need. See [Setup](#setup) below for details.

## How to use

### Setup

#### Recommended: Quick Setup with Init Command

The easiest way to get started is using the `init` command, which automates the entire setup process:

```bash
npx @adobe/aio-commerce-lib-config init
```

The `init` command will:

- Create `extensibility.config.js` with a template schema (if it doesn't exist)
- Add the `postinstall` script to your `package.json`
- Generate all required artifacts (schema and runtime actions)
- Update your `app.config.yaml` with the extension reference
- Create or update your `install.yaml` with the extension point reference
- Create or update your `.env` file with placeholder environment variables
- Install required dependencies (`@adobe/aio-commerce-lib-config` and `@adobe/aio-commerce-sdk`)

The command automatically detects your package manager (npm, pnpm, yarn, or bun) by checking for lock files and uses the appropriate commands.

After running `init`, you'll need to:

1. Review and customize `extensibility.config.js` with your configuration schema
2. Fill in the required values in your `.env` file

#### Alternative: Manual Setup

If you prefer to set up manually or need more control over the process:

1. Create your configuration schema at `extensibility.config.js` in the project root:

Define the structure of your application's configuration using a JavaScript module. This example shows how to create different types of configuration fields, such as list and text. Each field definition specifies its type, label, and optional default values.

```javascript
// Or export default if using ESM
module.exports = {
  businessConfig: {
    schema: [
      {
        name: "exampleList",
        type: "list",
        label: "Example List",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
        ],
        selectionMode: "single",
        default: "option1",
        description: "This is a description for the example list",
      },
      {
        name: "currency",
        type: "text",
        label: "Currency",
      },
      {
        name: "paymentMethod",
        type: "text",
        label: "Payment Test Method",
      },
      {
        name: "testField",
        type: "text",
        label: "Test Field",
        description: "This is a description for the test field",
        default: "Test Default Value",
      },
    ],
  },
};
```

2. Install the package and add a `postinstall` script:

```bash
npm install @adobe/aio-commerce-lib-config
```

Then add a `postinstall` script to your `package.json`:

```json
{
  "dependencies": {
    "@adobe/aio-commerce-lib-config": "^0.6.0"
  },

  "scripts": {
    "postinstall": "npx @adobe/aio-commerce-lib-config generate all"
  }
}
```

This script will run automatically every time you install your dependencies. This is done because the generated runtime actions will only change when you install the package for the first time, or a new version of it.

3. Generate the artifacts:

The CLI provides several commands:

- `@adobe/aio-commerce-lib-config init` - Initialize the project (recommended for first-time setup)
- `@adobe/aio-commerce-lib-config generate all` - Generate all artifacts (schema + runtime actions)
- `@adobe/aio-commerce-lib-config generate schema` - Generate the configuration schema only
- `@adobe/aio-commerce-lib-config generate actions` - Generate runtime actions and ext.config.yaml only
- `@adobe/aio-commerce-lib-config validate schema` - Validate your configuration schema

You can run these commands manually using `npx`:

```bash
# Generate everything (schema + actions)
npx @adobe/aio-commerce-lib-config generate all

# Or generate individually
npx @adobe/aio-commerce-lib-config generate schema
npx @adobe/aio-commerce-lib-config generate actions

# Validate schema
npx @adobe/aio-commerce-lib-config validate schema
```

4. In your `app.config.yaml` file, reference the generated `ext.config.yaml` file. If you have multiple extension points, add it as a new entry:

```yaml
extensions:
  commerce/configuration/1:
    $include: "src/commerce-configuration-1/ext.config.yaml"
```

5. In your `install.yaml` file, add the extension point reference. If you have multiple extension points, add it as a new entry:

```yaml
extensions:
  - extensionPointId: commerce/configuration/1
```

The generated `ext.config.yaml` file includes a `pre-app-build` hook that automatically regenerates the configuration schema before each build. This ensures your schema is always up-to-date. The hook is automatically added and should not be manually edited.

> [!IMPORTANT]
> The generated runtime actions require the SDK package. Make sure to install it before running your build, otherwise bundling will fail.
>
> ```bash
> npm install @adobe/aio-commerce-sdk
> ```

Upon running the generate commands, this will automatically create:

1. A **configuration schema** at `src/commerce-configuration-1/.generated/configuration-schema.json` - A validated JSON representation of your schema for runtime use
2. **Six runtime actions** under `src/commerce-configuration-1/.generated/actions/app-management/`:

**Scope Management Actions:**

Scopes define the hierarchical boundaries where configuration values can be set and inherited. For Adobe Commerce, these typically represent websites, stores, and store views. For external systems, you can define custom scope hierarchies that match your application's organizational structure.

- `get-scope-tree` - Retrieve scope hierarchies
- `sync-commerce-scopes` - Sync scopes from Adobe Commerce
- `set-custom-scope-tree` - Define custom scope hierarchies

**Configuration Management Actions:**

- `get-config-schema` - Retrieve configuration schema
- `get-configuration` - Get configuration values with inheritance
- `set-configuration` - Save configuration values

The `generate actions` command also creates the `ext.config.yaml` file with the required configuration and environment variable placeholders. It automatically adds a `pre-app-build` hook that regenerates the configuration schema before each build.

> [!IMPORTANT]
> Don't forget to fill in the necessary values for the Commerce configuration in your `.env` file before deploying your application.
>
> The generated actions require the following environment variables. Add them to your `.env` file:
>
> **For SaaS instances:**
>
> ```bash
> # Logging level for runtime actions
> LOG_LEVEL=info
>
> # Adobe Commerce API configuration
> AIO_COMMERCE_API_BASE_URL=https://your-commerce-instance.com
>
> # IMS Authentication (SaaS)
> AIO_COMMERCE_AUTH_IMS_CLIENT_ID=your-client-id
> AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS=your-client-secrets
> AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID=your-technical-account-id
> AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL=your-technical-account-email
> AIO_COMMERCE_AUTH_IMS_ORG_ID=your-ims-org-id
> AIO_COMMERCE_AUTH_IMS_SCOPES=your-ims-scopes
> ```
>
> **For PaaS instances:**
>
> ```bash
> # Logging level for runtime actions
> LOG_LEVEL=info
>
> # Adobe Commerce API configuration
> AIO_COMMERCE_API_BASE_URL=https://your-commerce-instance.com
>
> # Integration Authentication (PaaS)
> AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY=your-consumer-key
> AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET=your-consumer-secret
> AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN=your-access-token
> AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET=your-access-token-secret
> ```

### Initialize the Library

Initialize the library with basic settings or configure it with an Adobe Commerce instance, and uses the default cache timeout of 5 minutes. When working with Adobe Commerce, provide the appropriate authentication credentials based on your instance type (SaaS or PaaS).

```typescript
import { init } from "@adobe/aio-commerce-lib-config";

// Basic initialization
const config = init();

// With custom cache timeout (default is 300 seconds = 5 minutes)
const config = init({
  cacheTimeout: 600,
});

// With Adobe Commerce instance
const config = init({
  cacheTimeout: 600,
  commerce: {
    config: {
      baseUrl: "https://your-commerce-instance.com",
      flavor: "your-commerce-flavour", // "saas" or "paas"
    },
    auth: {
      // For SaaS instances
      clientId: "your-client-id",
      clientSecret: ["your-client-secret"],
      technicalAccountId: "your-technical-account-id",
      technicalAccountEmail: "your-technical-account-email",
      imsOrgId: "your-ims-org-id",

      // For PaaS instances
      consumerKey: "your-consumer-key",
      consumerSecret: "your-consumer-secret",
      accessToken: "your-access-token",
      accessTokenSecret: "your-access-token-secret",
    },
  },
});
```

You can also use `resolveCommerceHttpClientParams` to automatically resolve client parameters from action inputs:

```typescript
import { resolveCommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import { init } from "@adobe/aio-commerce-lib-config";

const commerceConfig = resolveCommerceHttpClientParams(params);
// SaaS with IMS Auth resolves to: { config: { flavor: "saas", baseUrl: "..." }, auth: { ... ImsAuthParams } }
// PaaS with Integration Auth resolves to: { config: { flavor: "paas", baseUrl: "..." }, auth: { ... IntegrationAuthParams } }

const config = init({
  cacheTimeout: 600,
  commerce: commerceConfig,
});
```

The resolver automatically detects flavor from the URL and auth type from the provided parameters. Define actual values in your `.env` file.

### Working with Scope Trees

Retrieve and manage scope hierarchies to organize your configuration values. Use cached scope data for better performance, or force a refresh when you need the latest data from Adobe Commerce. For external systems, define custom scope hierarchies that match your application's organizational structure.

```typescript
// Get cached scope tree
const result = await config.getScopeTree();
console.log(result.scopeTree);
console.log("Using cached data:", result.isCachedData);

// Force refresh from Commerce
const freshResult = await config.getScopeTree(true);

// Sync Commerce scopes explicitly
const syncResult = await config.syncCommerceScopes();
console.log("Synced:", syncResult.synced);

// Set custom scope tree for external systems
await config.setCustomScopeTree({
  scopes: [
    {
      code: "external_system_master",
      label: "External System Master",
      level: "external_level1",
      is_editable: true,
      is_final: false,
      children: [
        {
          code: "external_subsystem",
          label: "External Subsystem",
          level: "external_level2",
          is_editable: true,
          is_final: false,
        },
      ],
    },
  ],
});
```

### Managing Configuration

Read and write configuration values at any scope level in your hierarchy. Configuration values automatically inherit from parent scopes when not explicitly set, following the inheritance model. Use `getConfigurationByKey` when you need a single value, or `getConfiguration` to retrieve all configuration values for a scope.

```typescript
// Get configuration by scope ID
const config1 = await config.getConfiguration("scope-id-123");

// Get configuration by scope code (uses default level base)
const config2 = await config.getConfiguration("us-east");

// Get configuration by scope code and level
const config3 = await config.getConfiguration("us-west", "store");
console.log(config3.config);

// Get a specific configuration value
const {
  config: { value },
} = await config.getConfigurationByKey("paymentMethod", "us-west", "store");

console.log(value);

// Set configuration for a scope
await config.setConfiguration(
  {
    config: [
      { name: "paymentMethod", value: "credit_card" },
      { name: "currency", value: "USD" },
    ],
  },
  "us-west",
  "store",
);

// Get the configuration schema
const schema = await config.getConfigSchema();
console.log(schema); // Array of field definitions
```

### Using Configuration in Runtime Actions

This example demonstrates a typical use case: retrieving scope-specific configuration values within a runtime action. The action receives scope information (store code and level) from the incoming request parameters and uses it to fetch the appropriate configuration values. This pattern ensures that each request is processed with the correct settings for that particular scope.

```javascript
// actions/process-order/index.js
const { init } = require("@adobe/aio-commerce-lib-config");

async function main(params) {
  try {
    const config = init();

    // Get configuration for the current scope
    const storeCode = params.store_code || "default";
    const storeLevel = params.store_level || "store_view";

    // Get specific configuration values
    const {
      config: { value: paymentMethod },
    } = await config.getConfigurationByKey(
      "paymentMethod",
      storeCode,
      storeLevel,
    );

    const {
      config: { value: currency },
    } = await config.getConfigurationByKey("currency", storeCode, storeLevel);

    // Use configuration in your business logic
    console.log(`Processing order with ${paymentMethod} in ${currency}`);
    return {
      statusCode: 200,
      body: { success: true },
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: { error: error.message },
    };
  }
}

exports.main = main;
```

### Configuration Inheritance

Configuration values are resolved in this order (first match wins):

1. **Target Scope** - Value set directly on the requested scope
2. **Parent Scopes** - Walking up the hierarchy (e.g., `store_view` → `store` → `website`)
3. **Global Scope** - Application-wide default

Each configuration value includes an `origin` field showing where it was resolved from:

```typescript
{
  name: "currency",
  value: "USD",
  origin: {
    code: "global",      // Which scope provided this value
    level: "global"      // What level that scope is at
  }
}
```

### Schema Validation

Validate your schema before deployment:

```bash
npx @adobe/aio-commerce-lib-config validate schema
```

This command will:

- Check that your `extensibility.config.js` file exists and is valid
- Validate the schema structure and field definitions
- Ensure all required properties are present
- Report any validation errors with clear, descriptive error messages

The validation provides detailed error messages for each validation failure, making it easy to identify and fix issues in your schema configuration.

The library supports multiple field types for configuration schemas:

**Text Field:**

Use text fields for free-form input values like merchant identifiers or custom strings. Text fields support optional default values.

```javascript
{
  name: "merchant_id",
  label: "Merchant ID",
  type: "text",
  default: ""
}
```

**Password Field:**

Use password fields for sensitive values that should be masked in the UI. Password fields support optional default values.

```javascript
{
  name: "api_key",
  label: "API Key",
  type: "password",
  default: process.env.API_KEY
}
```

To use a password field with a secret default value, use the `process.env` object. Since this file should be committed to source control, you should not store secrets in plain text. If your default value is not a secret, you can use a plain string.

In order to be able to load your secrets from the environment variables, see the example below. You'll need to load the environment variables via `process.loadEnvFromFile` (if using Node 20 or higher):

```javascript
import { loadEnvFromFile } from "node:process";

// Default value is `.env`. But you can specify a different path (e.g. .env.development).
const env = loadEnvFromFile();
console.log(env.API_KEY); // "secret"
```

Or you can use the [`dotenv`](https://www.npmjs.com/package/dotenv) package (if using Node 18 or lower):

```javascript
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.API_KEY); // "secret"
```

**Boolean Field:**

Use boolean fields for true/false or yes/no settings. Boolean fields support optional default values.

```javascript
{
  name: "enable_feature",
  label: "Enable Feature",
  type: "boolean",
  default: false
}
```

**Number Field:**

Use number fields for numeric values. Number fields support optional default values.

```javascript
{
  name: "max_items",
  label: "Maximum Items",
  type: "number",
  default: 10
}
```

**Date Field:**

Use date fields for date values. Date fields support optional default values.

```javascript
{
  name: "start_date",
  label: "Start Date",
  type: "date",
  default: new Date("2024-01-01")
}
```

**Email Field:**

Use email fields for email addresses with automatic validation. Email fields support optional default values.

```javascript
{
  name: "admin_email",
  label: "Admin Email",
  type: "email",
  default: "admin@example.com"
}
```

**URL Field:**

Use URL fields for web addresses with automatic validation. URL fields support optional default values.

```javascript
{
  name: "api_endpoint",
  label: "API Endpoint",
  type: "url",
  default: "https://api.example.com"
}
```

**Phone Field:**

Use phone fields for telephone numbers with format validation. Phone fields support optional default values.

```javascript
{
  name: "support_phone",
  label: "Support Phone",
  type: "tel",
  default: "+1-555-123-4567"
}
```

**List Field (Dropdown):**

Use list fields when you need to restrict values to a predefined set of options. This is useful for settings like log levels, environment modes, or payment methods. List fields require both options and a default value.

The `selectionMode` field (required) controls whether users can select a single value or multiple values:

- `"single"`: Standard dropdown with single selection
- `"multiple"`: Allows multiple selections from the list

Single selection example:

```javascript
{
  name: "log_level",
  label: "Log Level",
  type: "list",
  selectionMode: "single",
  options: [
    { label: "Debug", value: "debug" },
    { label: "Info", value: "info" },
    { label: "Error", value: "error" }
  ],
  default: "info"
}
```

Multiple selection example:

```javascript
{
  name: "paymentMethods",
  label: "Enabled Payment Methods",
  type: "list",
  selectionMode: "multiple",
  options: [
    { label: "Credit Card", value: "credit_card" },
    { label: "PayPal", value: "paypal" },
    { label: "Apple Pay", value: "apple_pay" },
    { label: "Google Pay", value: "google_pay" }
  ],
  default: ["credit_card"]
}
```

> [!NOTE]
> For `selectionMode: "multiple"`, the `default` value must be an array of strings, even if only one option is selected by default.

## Best Practices

1. **Provide schema defaults** - List fields require a `default`, text fields are optional but recommended
2. **Use meaningful scope codes** - Makes it easier to identify scopes (e.g., `us-west-store` not `store1`)
3. **Validate configuration values** - Don't assume all values are valid in your runtime actions
4. **Use `getConfigurationByKey`** - Cleaner code when you only need a single value (returns null if key not found)
5. **Check for null when using `getConfigurationByKey`** - Always verify the config exists before using the value
