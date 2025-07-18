# `@adobe/aio-commerce-lib-auth`

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

Authentication utilities for Adobe Commerce apps deployed in Adobe App Builder.

This library provides a unified interface for authentication in Adobe Commerce App Builder applications, supporting multiple authentication mechanisms required for different integration scenarios.

## Overview

The library supports two main authentication providers:

- **IMS Provider**: For authenticating users or services via Adobe Identity Management System (IMS) using OAuth2
- **Integrations Provider**: For authenticating with Adobe Commerce integrations using OAuth 1.0a

These providers abstract the complexity of authentication, making it easy to obtain and use access tokens in your App Builder applications.

## Installation

```shell
pnpm install @adobe/aio-commerce-lib-auth
```

## Usage

In your App Builder application, you can use the library to authenticate users or services and obtain access tokens.

### IMS Provider

```typescript
import {
  getImsAuthProvider,
  assertImsAuthParams,
} from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  try {
    assertImsAuthParams(params);
    const imsAuth = getImsAuthProvider(params);

    const headers = await imsAuth.getHeaders();
    const response = await fetch("https://api.adobe.io/commerce/endpoint", {
      headers,
    });

    return { statusCode: 200, body: await response.json() };
  } catch (error) {
    return {
      statusCode: 400,
      body: { error: error.message },
    };
  }
};
```

### Integrations Provider

```typescript
import {
  getIntegrationAuthProvider,
  assertIntegrationAuthParams,
} from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  try {
    assertIntegrationAuthParams(params);

    const integrationsAuth = getIntegrationAuthProvider(params);
    const headers = integrationsAuth.getHeaders(
      "GET",
      "https://your-store.com/rest/V1/orders",
    );

    const response = await fetch("https://your-store.com/rest/V1/orders", {
      headers,
    });

    return { statusCode: 200, body: await response.json() };
  } catch (error) {
    return {
      statusCode: 400,
      body: { error: error.message },
    };
  }

  // business logic e.g requesting orders
  return { statusCode: 200 };
};
```

## Error Handling

The library uses validation to ensure all required parameters are provided and correctly formatted. When validation fails, a `CommerceSdkValidationError` is thrown with detailed information about what went wrong.

```typescript
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

try {
  assertImsAuthParams({
    clientId: "valid-id",
    // Missing required fields
  });
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    console.error(error.display());
    // Output:
    // Invalid ImsAuthProvider configuration
    // ├── Schema validation error at clientSecrets → Expected at least one client secret for IMS auth
    // ├── Schema validation error at technicalAccountId → Expected a non-empty string value for the IMS auth parameter technicalAccountId
    // └── Schema validation error at technicalAccountEmail → Expected a valid email format for technicalAccountEmail
  }
}
```

## Best Practices

1. **Always validate parameters** - Use the `assert*` functions before creating providers
2. **Handle errors gracefully** - Catch and properly handle validation and authentication errors
3. **Store credentials securely** - Use environment variables or secure configuration management
4. **Cache tokens when possible** - The IMS provider handles token lifecycle internally
5. **Use TypeScript** - Leverage the full type safety provided by the library

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.
