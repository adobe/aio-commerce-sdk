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

1. Create your configuration schema at `init-files/configuration-schema.json`:

Define the structure of your application's configuration using a schema file. This example shows how to create different types of configuration fields, such as list and text. Each field definition specifies its type, label, and optional default values.

```json
[
  {
    "name": "exampleList",
    "type": "list",
    "options": [{ "label": "Option 1", "value": "option1" }],
    "default": "option1"
  },
  {
    "name": "currency",
    "type": "text",
    "label": "Currency"
  },
  {
    "name": "paymentMethod",
    "type": "text",
    "label": "Payment Test Method"
  },
  {
    "name": "testField",
    "type": "text",
    "label": "Test Field"
  }
]
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
      baseUrl: params.COMMERCE_BASE_URL,
      flavor: params.COMMERCE_FLAVOR, // "saas" or "paas"
    },
    auth: {
      // For SaaS instances
      clientId: params.COMMERCE_CLIENT_ID,
      clientSecret: params.COMMERCE_CLIENT_SECRET,
      technicalAccountId: params.COMMERCE_TECHNICAL_ACCOUNT_ID,
      technicalAccountEmail: params.COMMERCE_TECHNICAL_ACCOUNT_EMAIL,
      imsOrgId: params.COMMERCE_IMS_ORG_ID,
      // For PaaS instances
      consumerKey: params.COMMERCE_CONSUMER_KEY,
      consumerSecret: params.COMMERCE_CONSUMER_SECRET,
      accessToken: params.COMMERCE_ACCESS_TOKEN,
      accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET,
    },
  },
});
```

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

```json
{
  "name": "merchant_id",
  "label": "Merchant ID",
  "type": "text",
  "default": ""
}
```

**List Field (Dropdown):**

Use list fields when you need to restrict values to a predefined set of options. This is useful for settings like log levels, environment modes, or payment methods. List fields require both options and a default value.

```json
{
  "name": "log_level",
  "label": "Log Level",
  "type": "list",
  "options": [
    { "label": "Debug", "value": "debug" },
    { "label": "Info", "value": "info" },
    { "label": "Error", "value": "error" }
  ],
  "default": "info"
}
```

## Best Practices

1. **Provide schema defaults** - List fields require a `default`, text fields are optional but recommended
2. **Use meaningful scope codes** - Makes it easier to identify scopes (e.g., `us-west-store` not `store1`)
3. **Validate configuration values** - Don't assume all values are valid in your runtime actions
4. **Use `getConfigurationByKey`** - Cleaner code when you only need a single value (returns null if key not found)
5. **Check for null when using `getConfigurationByKey`** - Always verify the config exists before using the value
