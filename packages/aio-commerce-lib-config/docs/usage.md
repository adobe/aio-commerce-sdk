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

## How to use

### Setup

1. Create your configuration schema at `extensibility.config.js` in the project root:

Define the structure of your application's configuration using a JavaScript module. This example shows how to create different types of configuration fields, such as list and text. Each field definition specifies its type, label, and optional default values.

```javascript
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

2. Configure the pre-app-build hook in `app.config.yaml`:

> **Note**: The pre-app-build hook generates 6 runtime actions that are necessary if your application is going to be used/integrated within the Commerce App Management. Before adding this hook, you must install the required dependencies that these generated runtime actions reference:
>
> ```bash
> npm install @adobe/aio-commerce-lib-api @adobe/aio-commerce-lib-core
> ```

```yaml
hooks:
  pre-app-build: "node_modules/@adobe/aio-commerce-lib-config/dist/cjs/hooks/pre-app-build.cjs"
```

This automatically generates 6 runtime actions under `.generated/actions/app-management/`:

**Scope Management Actions:**

Scopes define the hierarchical boundaries where configuration values can be set and inherited. For Adobe Commerce, these typically represent websites, stores, and store views. For external systems, you can define custom scope hierarchies that match your application's organizational structure.

- `get-scope-tree` - Retrieve scope hierarchies
- `sync-commerce-scopes` - Sync scopes from Adobe Commerce
- `set-custom-scope-tree` - Define custom scope hierarchies

**Configuration Management Actions:**

- `get-config-schema` - Retrieve configuration schema
- `get-configuration` - Get configuration values with inheritance
- `set-configuration` - Save configuration values

The hook also configures the required environment variables in `ext.config.yaml`.

> **Important**: Don't forget to fill in the necessary values for the Commerce configuration in your `.env` file before the hook generates the environment variable placeholders.

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
const result = await config.getConfigurationByKey(
  "paymentMethod",
  "us-west",
  "store",
);
console.log(result.config?.value);

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
    const paymentMethodResult = await config.getConfigurationByKey(
      "paymentMethod",
      storeCode,
      storeLevel,
    );
    const currencyResult = await config.getConfigurationByKey(
      "currency",
      storeCode,
      storeLevel,
    );

    const paymentMethod = paymentMethodResult.config?.value;
    const currency = currencyResult.config?.value;

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
pnpm exec aio-commerce-lib-config-schema-validate
```

The library supports two field types for configuration schemas:

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

**List Field (Dropdown):**

Use list fields when you need to restrict values to a predefined set of options. This is useful for settings like log levels, environment modes, or payment methods. List fields require both options and a default value.

The `selectionMode` field (optional) controls whether users can select a single value or multiple values:

- `"single"` (default if omitted): Standard dropdown with single selection
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
  default: "credit_card"
}
```

## Best Practices

1. **Provide schema defaults** - List fields require a `default`, text fields are optional but recommended
2. **Use meaningful scope codes** - Makes it easier to identify scopes (e.g., `us-west-store` not `store1`)
3. **Validate configuration values** - Don't assume all values are valid in your runtime actions
4. **Use `getConfigurationByKey`** - Cleaner code when you only need a single value (returns null if key not found)
5. **Check for null when using `getConfigurationByKey`** - Always verify the config exists before using the value
