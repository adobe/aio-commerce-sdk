# API Documentation

## packages/aio-commerce-lib-auth/source/lib/ims-auth/schema.ts

### Variables

#### `imsAuthParameter`

Creates a validation schema for a required IMS auth string parameter.

**Parameters:**

- `name` - The name of the parameter for error messages.

**Returns:** A validation pipeline that ensures the parameter is a non-empty string.

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/schema.ts:31`

---

#### `stringArray`

Creates a validation schema for an IMS auth string array parameter.

**Parameters:**

- `name` - The name of the parameter for error messages.

**Returns:** A validation pipeline that ensures the parameter is an array of strings.

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/schema.ts:44`

---

#### `IMS_AUTH_ENV`

/\*\* The environments accepted by the IMS auth service.

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/schema.ts:54`

---

#### `ImsAuthEnvSchema`

/\*\* Validation schema for IMS auth environment values.

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/schema.ts:60`

---

#### `ImsAuthParamsSchema`

/\*\* Defines the schema to validate the necessary parameters for the IMS auth service.

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/schema.ts:63`

---
