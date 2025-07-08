# @adobe/aio-commerce-lib-auth

Authentication utilities for Adobe Commerce apps deployed in Adobe App Builder.

It supports two main authentication providers:

- **IMS Provider**: For authenticating users or services via Adobe Identity Management System (IMS) using OAuth2.
- **Integrations Provider**: For authenticating with Adobe Commerce integrations using OAuth 1.0a.

These providers abstract the complexity of authentication, making it easy to obtain and use access tokens in your App Builder applications.

## Installation

```shell
npm install @adobe/aio-commerce-lib-auth
```

## Usage

In your App Builder application, you can use the library to authenticate users or services and obtain access tokens.

### IMS Provider

In the runtime action you can generate an access token using the IMS Provider:

```typescript
import { tryGetImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
import { isErr, unwrapErr, unwrap } from "@adobe/aio-commerce-lib-core";

export const main = async function (params: Record<string, unknown>) {
  const result = tryGetImsAuthProvider(params); // Validate parameters and get the integration auth provider

  if (isErr(result)) {
    const error = unwrapErr(result);
    return {
      statusCode: 400,
      body: {
        error: `Unable to get IMS Auth Provider ${error.message}`,
      },
    };
  }

  const imsAuthProvider = unwrap(result);
  const headersResult = imsAuthProvider.getHeaders();

  if (isErr(headersResult)) {
    const error = unwrapErr(headersResult);
    return {
      statusCode: 400,
      body: {
        error: `Unable to get auth headers for IMS Auth Provider ${error.message}`,
      },
    };
  }

  // business logic e.g requesting orders
  return { statusCode: 200 };
};
```

### Integrations Provider

In the runtime action you can generate an access token using the Integrations Provider:

```typescript
import { tryGetIntegrationAuthProvider } from "@adobe/aio-commerce-lib-auth";
import { isErr, unwrapErr, unwrap } from "@adobe/aio-commerce-lib-core";

export const main = async function (params: Record<string, unknown>) {
  const result = tryGetIntegrationAuthProvider(params); // Validate parameters and get the integration auth provider

  if (isErr(result)) {
    const error = unwrapErr(result);
    return {
      statusCode: 400,
      body: {
        error: `Unable to get Integration Auth Provider ${error.message}`,
      },
    };
  }

  const integrationsAuth = unwrap(result);
  const headersResult = integrationsAuth.getHeaders(
    "GET",
    "http://localhost/rest/V1/orders",
  );

  if (isErr(headersResult)) {
    const error = unwrapErr(headersResult);
    return {
      statusCode: 400,
      body: {
        error: `Unable to get auth headers for Integration Auth Provider ${error.message}`,
      },
    };
  }

  // business logic e.g requesting orders

  return { statusCode: 200 };
};
```

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.
