# `@adobe/aio-commerce-lib-auth`

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

Authentication utilities for Adobe Commerce apps deployed in Adobe App Builder.

This library provides a unified interface for authentication in Adobe Commerce App Builder applications, supporting multiple authentication mechanisms required for different integration scenarios.

## Overview

The library supports two main authentication providers:

- **IMS Provider**: For authenticating users or services via Adobe Identity Management System (IMS) using OAuth2.
  - Required Params
    - AIO_COMMERCE_IMS_CLIENT_ID: string
    - AIO_COMMERCE_IMS_CLIENT_SECRETS: string
    - AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: string
    - AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: string
    - AIO_COMMERCE_IMS_IMS_ORG_ID: string
    - AIO_COMMERCE_IMS_ENV: string e.g `'prod'` or `'stage'`
    - AIO_COMMERCE_IMS_SCOPES: string e.g `'["value1", "value2"]'`
    - AIO_COMMERCE_IMS_CTX: string
- **Integrations Provider**: For authenticating with Adobe Commerce integrations using OAuth 1.0a.
  - Required params
    - AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: string
    - AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: string
    - AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: string
    - AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: string

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
import {
  assertImsAuthParams,
  getImsAuthProvider,
} from "@adobe/aio-commerce-lib-auth";
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core";

export const main = async function (params: Record<string, unknown>) {
  try {
    // Validate parameters and get the IMS auth provider
    assertImsAuthParams(params);
    const imsAuthProvider = getImsAuthProvider(params);

    // Get access token
    const token = await imsAuthProvider.getAccessToken();

    // Get headers for API requests
    const headers = await imsAuthProvider.getHeaders();

    // Use headers in your API calls
    // business logic e.g requesting orders
    return { statusCode: 200 };
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      return {
        statusCode: 400,
        body: {
          error: `Invalid IMS configuration: ${error.message}`,
        },
      };
    }
    throw error;
  }
};
```

### Integrations Provider

In the runtime action you can generate an access token using the Integrations Provider:

```typescript
import {
  assertIntegrationAuthParams,
  getIntegrationAuthProvider,
} from "@adobe/aio-commerce-lib-auth";
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core";

export const main = async function (params: Record<string, unknown>) {
  try {
    // Validate parameters and get the integration auth provider
    assertIntegrationAuthParams(params);
    const integrationsAuth = getIntegrationAuthProvider(params);

    // Get OAuth headers for API requests
    const headers = integrationsAuth.getHeaders(
      "GET",
      "http://localhost/rest/V1/orders",
    );

    // Use headers in your API calls
    // business logic e.g requesting orders
    return { statusCode: 200 };
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      return {
        statusCode: 400,
        body: {
          error: `Invalid Integration configuration: ${error.message}`,
        },
      };
    }
    throw error;
  }
};
```

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.
