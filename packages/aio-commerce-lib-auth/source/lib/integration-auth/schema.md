# API Documentation

## packages/aio-commerce-lib-auth/source/lib/integration-auth/schema.ts

### Variables

#### `integrationAuthParameter`

Creates a validation schema for a required Commerce Integration string parameter.

**Parameters:**

- `name` - The name of the parameter for error messages.

**Returns:** A validation pipeline that ensures the parameter is a non-empty string.

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/schema.ts:37`

---

#### `BaseUrlSchema`

/\*\* Validation schema for the Adobe Commerce endpoint base URL.

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/schema.ts:48`

---

#### `UrlSchema`

/\*\* Validation schema that accepts either a URL string or URL instance and normalizes to string.

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/schema.ts:55`

---

#### `IntegrationAuthParamsSchema`

The schema for the Commerce Integration parameters.
This is used to validate the parameters passed to the Commerce Integration provider.

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/schema.ts:68`

---
