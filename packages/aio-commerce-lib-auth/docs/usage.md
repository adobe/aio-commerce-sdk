# `@adobe/aio-commerce-lib-auth` Documentation

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

## Overview

The library supports two main authentication providers:

- **IMS Provider**: For authenticating users or services via Adobe Identity Management System (IMS) using OAuth2
- **Integrations Provider**: For authenticating with Adobe Commerce integrations using OAuth 1.0a

These providers abstract the complexity of authentication, making it easy to obtain and use access tokens in your App Builder applications.

### Quick Start

For simple use cases, use `resolveAuthParams` to automatically detect and resolve authentication parameters:

```typescript
import { resolveAuthParams } from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  // Automatically detects IMS or Integration auth based on provided params
  const authProvider = resolveAuthParams(params);

  if (authProvider.strategy === "ims") {
    // Use IMS-specific methods
  } else {
    // Use Integration-specific methods
  }
};
```

## Reference

See the [API Reference](./api-reference/README.md) for a full list of symbols exported by the library.

### IMS Provider

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

    const token = await imsAuthProvider.getAccessToken();
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

### Error Handling

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

### Automatic Auth Resolution

The `resolveAuthParams` function automatically detects and resolves authentication parameters from your runtime action inputs. It inspects the provided parameters and determines whether to use IMS or Integration authentication based on which required keys are present.

#### Required Parameters

The resolver checks for the following parameter keys:

**IMS Authentication** (requires all of these):
| Parameter Key | Description |
|---------------|-------------|
| `AIO_COMMERCE_AUTH_IMS_CLIENT_ID` | IMS OAuth client ID |
| `AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS` | IMS client secrets (comma-separated) |
| `AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID` | Technical account ID |
| `AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL` | Technical account email |
| `AIO_COMMERCE_AUTH_IMS_ORG_ID` | IMS organization ID |
| `AIO_COMMERCE_AUTH_IMS_SCOPES` | OAuth scopes (comma-separated) |

**Integration Authentication** (requires all of these):
| Parameter Key | Description |
|---------------|-------------|
| `AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY` | OAuth consumer key |
| `AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET` | OAuth consumer secret |
| `AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN` | OAuth access token |
| `AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET` | OAuth access token secret |

> **Note:** In App Builder runtime actions, these parameters are typically provided via runtime action inputs in your `app.config.yaml` file and automatically passed to your action's `params` object.

#### Basic Usage

```typescript
import { resolveAuthParams } from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  try {
    // Auto-detect authentication type (IMS or Integration)
    const authProvider = resolveAuthParams(params);

    console.log(authProvider.strategy); // "ims" or "integration"

    // Type-safe access to provider-specific properties
    if (authProvider.strategy === "ims") {
      console.log(authProvider.clientId);
      console.log(authProvider.orgId);
    } else {
      console.log(authProvider.consumerKey);
      console.log(authProvider.accessToken);
    }

    return { statusCode: 200 };
  } catch (error) {
    return {
      statusCode: 400,
      body: { error: String(error) },
    };
  }
};
```

#### Forcing a Specific Strategy

You can also force a specific authentication strategy:

```typescript
// Force IMS authentication
const imsAuth = resolveAuthParams(params, "ims");
console.log(imsAuth.strategy); // "ims"

// Force Integration authentication
const integrationAuth = resolveAuthParams(params, "integration");
console.log(integrationAuth.strategy); // "integration"
```

#### How Detection Works

The resolver uses the following logic:

1. **Auto mode (default)**: Checks for IMS parameters first. If all IMS parameters are present, returns IMS auth. Otherwise, checks for Integration parameters. If all Integration parameters are present, returns Integration auth. If neither set is complete, throws an error.

2. **Explicit strategy**: When you specify `"ims"` or `"integration"`, the resolver validates only those specific parameters and throws a validation error if they're missing or invalid.

## Best Practices

1. **Use `resolveAuthParams` for flexibility** - Automatically detects auth type, making your code work with both IMS and Integration auth
2. **Use `assert*` functions for validation** - When you need explicit validation before creating providers
3. **Handle errors gracefully** - Catch and properly handle validation and authentication errors
