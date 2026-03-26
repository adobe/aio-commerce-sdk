# `@adobe/aio-commerce-lib-config` Documentation

## Overview

The `@adobe/aio-commerce-lib-config` library provides:

- **Configuration Management**: Read and write configuration values across hierarchical scopes
- **Scope Trees**: Support for Adobe Commerce and external system scope hierarchies
- **Inheritance Model**: Automatic configuration inheritance from parent scopes
- **Schema Validation**: Validate configuration schemas with in-memory schema storage
- **Persistent Storage**: Uses `@adobe/aio-lib-state` and `@adobe/aio-lib-files` for configuration data caching and storage

## Reference

See the [API Reference](./api-reference/README.md) for a full list of classes, interfaces, and functions exported by the library.

## How to use

### Setup

Install the package:

```bash
npm install @adobe/aio-commerce-lib-config
```

### Using the Library

The library uses a function-based API. Import the functions you need and call them directly. Most functions use sensible defaults, so you typically don't need to pass configuration options unless you need custom behavior.

#### Basic Import Pattern

```typescript
import {
  getConfiguration,
  getConfigurationByKey,
  getConfigSchema,
  getScopeTree,
  setConfiguration,
  setCustomScopeTree,
  syncCommerceScopes,
  unsyncCommerceScopes,
  byScopeId,
  byCode,
  byCodeAndLevel,
  initialize,
} from "@adobe/aio-commerce-lib-config";
```

### Initialization

**⚠️ Required:** You must initialize the library with your configuration schema before using any configuration functions. Calling configuration functions without initialization will throw an error.

The schema is stored in memory only and must be provided on each application startup. The schema is not persisted to disk.

```typescript
import { initialize } from "@adobe/aio-commerce-lib-config";
import yourSchema from "path/to/config-schema.json" with { type: "json" };

// Required: Initialize with your schema
await initialize({
  schema: yourSchema,
});

// Now you can use configuration functions
const config = await getConfiguration(byCodeAndLevel("global", "global"));
```

**What happens without initialization:**

Configuration functions like `getConfiguration()` and `getConfigurationByKey()` will throw an error:

```
Error: Schema not initialized. Call `initialize({ schema })` before using configuration functions.
```

### Working with Scope Trees

Retrieve and manage scope hierarchies to organize your configuration values. Use cached scope data for better performance, or force a refresh when you need the latest data from Adobe Commerce. For external systems, define custom scope hierarchies that match your application's organizational structure.

```typescript
import {
  getScopeTree,
  syncCommerceScopes,
  unsyncCommerceScopes,
  setCustomScopeTree,
} from "@adobe/aio-commerce-lib-config";
import { resolveCommerceHttpClientParams } from "@adobe/aio-commerce-sdk/api";

// Get cached scope tree
const result = await getScopeTree();
console.log(result.scopeTree);
console.log("Using cached data:", result.isCachedData);

// Force refresh from Commerce API (requires commerce config)
const commerceConfig = resolveCommerceHttpClientParams(params);
const freshResult = await getScopeTree(
  {
    refreshData: true,
    commerceConfig,
  },
  { cacheTimeout: 600000 },
);

console.log("Using fresh data:", !freshResult.isCachedData);

// Sync Commerce scopes explicitly (requires commerce config)
const syncResult = await syncCommerceScopes(commerceConfig, {
  cacheTimeout: 600000,
});
console.log("Synced:", syncResult.synced);

// Set custom scope tree for external systems
await setCustomScopeTree({
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

// Remove Commerce scopes from the persisted scope tree
const { unsynced } = await unsyncCommerceScopes();
if (unsynced) {
  console.log("Commerce scopes removed successfully");
} else {
  console.log("No Commerce scopes were found to remove");
}
```

### Managing Configuration

Read and write configuration values at any scope level in your hierarchy. Configuration values automatically inherit from parent scopes when not explicitly set, following the inheritance model. Use `getConfigurationByKey` when you need a single value, or `getConfiguration` to retrieve all configuration values for a scope.

```typescript
import {
  getConfiguration,
  getConfigurationByKey,
  getConfigSchema,
  setConfiguration,
  byScopeId,
  byCode,
  byCodeAndLevel,
} from "@adobe/aio-commerce-lib-config";

// Get configuration by scope ID
const config1 = await getConfiguration(byScopeId("scope-id-123"));

// Get configuration by scope code (uses default level base)
const config2 = await getConfiguration(byCode("us-east"));

// Get configuration by scope code and level
const config3 = await getConfiguration(byCodeAndLevel("us-west", "store"));
console.log(config3.config);

// Get a specific configuration value by key
const {
  config: { value },
} = await getConfigurationByKey(
  "paymentMethod",
  byCodeAndLevel("us-west", "store"),
);
console.log(value);

// Set configuration for a scope
await setConfiguration(
  {
    config: [
      { name: "paymentMethod", value: "credit_card" },
      { name: "currency", value: "USD" },
    ],
  },
  byCodeAndLevel("us-west", "store"),
);

// Get the configuration schema
const schema = await getConfigSchema();
console.log(schema); // Array of field definitions
```

### Using Configuration in Runtime Actions

This example demonstrates a typical use case: retrieving scope-specific configuration values within a runtime action. The action receives scope information (store code and level) from the incoming request parameters and uses it to fetch the appropriate configuration values. This pattern ensures that each request is processed with the correct settings for that particular scope.

```javascript
// actions/process-order/index.js
import {
  initialize,
  getConfigurationByKey,
  byCodeAndLevel,
} from "@adobe/aio-commerce-lib-config";
import schema from "./config-schema.json" with { type: "json" };

async function main(params) {
  try {
    await initialize({ schema });

    // Get configuration for the current scope
    const storeCode = params.store_code || "default";
    const storeLevel = params.store_level || "store_view";

    // Get specific configuration values
    const {
      config: { value: paymentMethod },
    } = await getConfigurationByKey(
      "paymentMethod",
      byCodeAndLevel(storeCode, storeLevel),
    );

    const {
      config: { value: currency },
    } = await getConfigurationByKey(
      "currency",
      byCodeAndLevel(storeCode, storeLevel),
    );

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

### Field Types

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

**Password Field:**

Use password fields for sensitive credentials like API keys, tokens, and secrets. Password values are automatically encrypted when stored and decrypted when retrieved. An encryption key must be configured in the `.env` and given as an `input` to all the actions that need to access password fields.

```javascript
{
  name: "api_key",
  label: "API Key",
  type: "password",
  description: "Your secret API key"
}
```

See the [Password Encryption Guide](./password-encryption.md) for more details on encryption, key management, and security best practices.

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

## CLI Commands

The library provides CLI commands to help manage encryption for password fields:

```bash
# Generate and write an encryption key to your .env file
npx @adobe/aio-commerce-lib-config encryption setup

# Validate the configured encryption key
npx @adobe/aio-commerce-lib-config encryption validate
```

### `encryption setup`

Generates a new AES-256 encryption key and writes it to your `.env` file as `AIO_COMMERCE_CONFIG_ENCRYPTION_KEY`. If a key already exists, it will be overwritten.

> [!TIP]
> Run this command once during initial setup if your configuration schema includes `password` fields. See the [Password Encryption](./password-encryption.md) documentation for full details.

### `encryption validate`

Validates that `AIO_COMMERCE_CONFIG_ENCRYPTION_KEY` is present in your environment and correctly formatted as a 64-character hex string.

> [!TIP]
> This command is also available for manual verification or use in CI/CD pipelines where the encryption key must be confirmed before a build or deployment.

## Best Practices

1. **Provide schema defaults** - List fields require a `default`, for other fields they are optional, but recommended
2. **Use meaningful scope codes** - Makes it easier to identify scopes (e.g., `us-west-store` not `store1`)
3. **Validate configuration values** - Don't assume all values are valid in your runtime actions
4. **Use `getConfigurationByKey`** - Cleaner code when you only need a single value (returns null if key not found)
5. **Check for null when using `getConfigurationByKey`** - Always verify the config exists before using the value
