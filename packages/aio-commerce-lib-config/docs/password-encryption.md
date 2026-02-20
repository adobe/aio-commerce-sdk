# Password Field Encryption

The config library supports secure storage of password-type configuration fields through automatic encryption and decryption. This feature ensures that sensitive credentials are never stored in plain text.

## Overview

When you define a configuration field with `type: "password"` in your schema, the library automatically:

- **Encrypts** the value when storing it using `setConfiguration`
- **Decrypts** the value when retrieving it using `getConfiguration` or `getConfigurationByKey`

All encryption uses AES-256-GCM, a secure and industry-standard encryption algorithm with authenticated encryption.

## Setup

### 1. Define Password Fields in Your Schema

First, define fields with `type: "password"` in your configuration schema:

```json
[
  {
    "name": "api_key",
    "type": "password",
    "label": "API Key",
    "description": "Your secret API key"
  },
  {
    "name": "database_password",
    "type": "password",
    "label": "Database Password",
    "description": "Password for database connection"
  }
]
```

### 2. Generate an Encryption Key

Run the following command at the root of your project to generate an encryption key:

```bash
npx aio-commerce-lib-config encryption setup
```

### Alternative: Manual Key Generation

If you need to generate a key manually (e.g., you don't have a `.env` file yet or need to generate keys for different environments):

```typescript
import { generateEncryptionKey } from "@adobe/aio-commerce-lib-config";

const key = generateEncryptionKey();
console.log("Add this to your .env file:");
console.log(`AIO_COMMERCE_CONFIG_ENCRYPTION_KEY=${key}`);
```

Then manually add the key to your `.env` file:

```bash
AIO_COMMERCE_CONFIG_ENCRYPTION_KEY=your_generated_64_character_hex_key_here
```

**Important Security Notes:**

- Never commit the `.env` file to version control
- Keep the encryption key secure and only accessible in the app runtime context
- The key should be 64 hexadecimal characters (32 bytes for AES-256)
- Store the key securely in your deployment environment
- **Encryption is strictly enforced** - operations will fail if the key is not configured (passwords are never stored in plain text)

## Usage

### Setting Password Values

Password values are automatically encrypted when you set them. **Note:** A valid encryption key must be configured, or the operation will throw an error.

```typescript
import { setConfiguration, byScopeId } from "@adobe/aio-commerce-lib-config";

// The password will be encrypted before storage
// Throws an error if AIO_COMMERCE_CONFIG_ENCRYPTION_KEY is not configured
await setConfiguration(
  {
    config: [
      { name: "api_key", value: "my-secret-api-key" },
      { name: "database_password", value: "super-secret-password" },
    ],
  },
  byScopeId("scope-123"),
);
```

**Error Handling Example:**

```typescript
try {
  await setConfiguration(
    {
      config: [{ name: "api_key", value: "my-secret-api-key" }],
    },
    byScopeId("scope-123"),
  );
} catch (error) {
  // Will throw if AIO_COMMERCE_CONFIG_ENCRYPTION_KEY is not configured
  console.error("Failed to save configuration:", error.message);
}
```

### Getting Password Values

Password values are automatically decrypted when you retrieve them:

```typescript
import { getConfiguration, byScopeId } from "@adobe/aio-commerce-lib-config";

// The password will be decrypted before being returned
const config = await getConfiguration(byScopeId("scope-123"));

// Use the decrypted password
const apiKey = config.config.find((c) => c.name === "api_key")?.value;
console.log(apiKey); // "my-secret-api-key" (decrypted)
```

### Getting a Specific Password Value

```typescript
import {
  getConfigurationByKey,
  byScopeId,
} from "@adobe/aio-commerce-lib-config";

// Get and decrypt a specific password field
const result = await getConfigurationByKey("api_key", byScopeId("scope-123"));

if (result.config) {
  console.log(result.config.value); // "my-secret-api-key" (decrypted)
}
```

## How It Works

### Encryption Process

1. When you call `setConfiguration` with a password field:
   - The library checks the schema to identify password-type fields
   - For each password field, it encrypts the value using AES-256-GCM
   - A random initialization vector (IV) is generated for each encryption
   - An authentication tag is generated to verify data integrity
   - The encrypted value is stored with the format: `enc:IV:AUTH_TAG:ENCRYPTED_DATA`

### Decryption Process

1. When you call `getConfiguration` or `getConfigurationByKey`:
   - The library checks the schema to identify password-type fields
   - For each password field with an encrypted value (starts with `enc:`):
   - It extracts the IV, authentication tag, and encrypted data
   - Verifies the authentication tag to ensure data integrity
   - Decrypts the value using the encryption key from the environment
   - Returns the plain text password

### Storage Format

Encrypted passwords are stored in the following format:

```
enc:INITIALIZATION_VECTOR:AUTH_TAG:ENCRYPTED_DATA
```

For example:

```
enc:a1b2c3d4e5f6g7h8:i9j0k1l2m3n4o5p6:q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6
```

## Security Best Practices

### 1. Environment Variable Management

- **Never hardcode** the encryption key in your source code
- **Never commit** the `.env` file to version control
- Use a `.env.dist` file with placeholder values:

```bash
# .env.dist
AIO_COMMERCE_CONFIG_ENCRYPTION_KEY=your_key_here
```

### 2. Key Rotation

To rotate your encryption key:

1. Generate a new key using `generateEncryptionKey()`
2. Decrypt all existing passwords with the old key
3. Update `AIO_COMMERCE_CONFIG_ENCRYPTION_KEY` with the new key
4. Re-encrypt all passwords with the new key

```typescript
import {
  generateEncryptionKey,
  getConfiguration,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";

// 1. Get all configs with old key
const oldConfig = await getConfiguration(byScopeId("scope-123"));

// 2. Generate and set new key
const newKey = generateEncryptionKey();
process.env.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY = newKey;

// 3. Re-save configs (will encrypt with new key)
await setConfiguration({ config: oldConfig.config }, byScopeId("scope-123"));
```

### 3. Access Control

- Limit access to the `.env` file to only the application runtime
- Use secure secret management services in production (e.g., AWS Secrets Manager, Azure Key Vault)
- Ensure the encryption key is only available in the app context

## Encryption Requirements

### Strict Encryption Enforcement

Password encryption is **strictly enforced**:

**At Runtime:**

- Setting a password field **requires** a valid encryption key - the operation will throw an error if the key is missing
- Getting encrypted passwords **requires** a valid encryption key to decrypt
- **No plain text fallback exists** - this ensures passwords are never stored unencrypted

This strict enforcement is a **security feature** to prevent accidentally storing passwords in plain text under any circumstances.

### Runtime Behavior

**When setting passwords:**

- If encryption fails, an error is thrown (most commonly: `AIO_COMMERCE_CONFIG_ENCRYPTION_KEY` not configured)
- Passwords are **never** stored in plain text

**When getting encrypted passwords (if key is missing, invalid, or decryption fails):**

- The encrypted value is returned as-is (still encrypted, not exposed)
- An error is logged with details for troubleshooting
- The application continues to function (reading other config values)

## Troubleshooting

### "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY not found" Warning

**Cause**: The environment variable is not set at runtime.

**Solution**: Ensure the encryption key is in your `.env` file:

```bash
AIO_COMMERCE_CONFIG_ENCRYPTION_KEY=your_64_character_hex_key
```

### "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY is not a valid hex string" Warning

**Cause**: The key format is incorrect.

**Solution**: Generate a new key using `generateEncryptionKey()` and ensure it's a 64-character hexadecimal string.

### "Failed to decrypt password" Error

**Cause**: The encryption key has changed or the data is corrupted.

**Solution**:

1. Verify the correct encryption key is in your `.env` file
2. If the key was rotated, decrypt with the old key and re-encrypt with the new key
3. If data is corrupted, reset the password value
