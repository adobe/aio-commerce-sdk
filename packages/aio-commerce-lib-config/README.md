# `@adobe/aio-commerce-lib-config`

> [!WARNING]
> This package is still under development and is not yet ready for use. You might be able to install it, but you may encounter breaking changes.

Configuration management library for Adobe Commerce and external systems with hierarchical scopes, inheritance, versioning, and audit logging.

This library provides a comprehensive solution for managing business configuration across Adobe Commerce and other external systems. It handles configuration schemas, hierarchical scope trees, and configuration values with built-in support for inheritance, caching, **automatic versioning**, **audit logging**, and integration with the App Management UI.

## Key Features

- ✅ **Hierarchical Configuration**: Scope-based configuration with inheritance
- ✅ **Automatic Versioning**: Every configuration change creates a new version with diff calculation
- ✅ **Audit Logging**: Immutable audit trail with SHA-256 integrity hashing
- ✅ **GDPR Compliant**: Automatic redaction of sensitive data (passwords, API keys, secrets)
- ✅ **Rollback Support**: Restore configuration to any previous version
- ✅ **Actor Tracking**: Record who made each change with full metadata
- ✅ **Configurable Retention**: Keep up to N versions (default: 25, via `MAX_CONFIG_VERSIONS` env var)

## Installation

```bash
pnpm add @adobe/aio-commerce-lib-config
```

## Quick Start

```typescript
import {
  setConfiguration,
  getConfigurationHistory,
  getVersionComparison,
  compareVersions,
  getAuditLog,
  rollbackConfiguration,
  byScopeId,
} from "@adobe/aio-commerce-lib-config";

// Set configuration (automatically versioned and audited)
const result = await setConfiguration(
  {
    config: [
      { name: "api_key", value: "your-key" }, // Automatically redacted in history
      { name: "timeout", value: 5000 },
    ],
    metadata: {
      actor: {
        userId: "admin@example.com",
        source: "admin-panel",
      },
    },
  },
  byScopeId("scope-123"),
);

console.log(`Version ${result.versionInfo.versionNumber} created`);

// Get version history
const history = await getConfigurationHistory("scope-code", { limit: 10 });
console.log(`Total versions: ${history.pagination.total}`);

// View before/after for a specific version (perfect for UI)
const comparison = await getVersionComparison("scope-code", "version-id");
if (comparison) {
  console.log("Before:", comparison.before);
  console.log("After:", comparison.after);
  console.log("Changes:", comparison.changes);
}

// Compare two versions side-by-side
const diff = await compareVersions("scope-code", "version-5", "version-10");
if (diff) {
  console.log(`${diff.changes.length} changes between versions`);
}

// Get audit log
const auditLog = await getAuditLog({ scopeCode: "scope-code" });
console.log(`Total changes: ${auditLog.pagination.total}`);

// Rollback to previous version
await rollbackConfiguration("scope-code", "version-id-to-restore", {
  actor: { userId: "admin@example.com" },
});
```

## Documentation

- [Usage Guide](./docs/usage.md) - Basic usage and configuration management
- [Versioning and Audit Guide](./docs/versioning-and-audit.md) - Complete guide to versioning and audit features
- [Adobe Storage Best Practices](./docs/adobe-storage-best-practices.md) - How we implement Adobe's recommended patterns
- [Storage Architecture](./docs/storage-architecture.md) - **NEW!** How multiple config values are stored and archived

## Contributing

This package is part of the Adobe Commerce SDK monorepo. Refer to the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for information on development setup and guidelines.
