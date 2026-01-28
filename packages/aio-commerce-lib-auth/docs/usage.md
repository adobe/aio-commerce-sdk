# `@adobe/aio-commerce-lib-auth` Documentation

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

## Overview

The library supports two main authentication providers:

- **IMS Provider**: For authenticating users or services via Adobe Identity Management System (IMS) using OAuth2
- **Integrations Provider**: For authenticating with Adobe Commerce integrations using OAuth 1.0a

Additionally, the library provides **forwarding utilities** for passing authentication credentials from incoming requests to downstream services, useful for proxy patterns or service chaining.

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

### Forwarding IMS Authentication

When building actions that receive authenticated requests and need to forward those credentials to downstream services, use the forwarding utilities. This is useful for proxy patterns or when chaining multiple services.

#### From Runtime Action Parameters

When credentials are passed as action parameters (e.g., via `app.config.yaml` inputs), use `forwardImsAuthProviderFromParams`:

```typescript
import { forwardImsAuthProviderFromParams } from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  // params contains: { AIO_COMMERCE_IMS_AUTH_TOKEN: "eyJ...", AIO_COMMERCE_IMS_AUTH_API_KEY: "..." }
  const authProvider = forwardImsAuthProviderFromParams(params);

  // Use the forwarded credentials in downstream API calls
  const response = await fetch("https://api.adobe.io/some-endpoint", {
    headers: await authProvider.getHeaders(),
  });

  return { statusCode: 200, body: await response.json() };
};
```

The function reads the following parameters:

- `AIO_COMMERCE_IMS_AUTH_TOKEN` (required) - The IMS access token
- `AIO_COMMERCE_IMS_AUTH_API_KEY` (optional) - The API key

#### From a Runtime Action Incoming Request (Invoked via HTTP)

When credentials come from HTTP request headers, use `forwardImsAuthProviderFromRequest`:

```typescript
import { forwardImsAuthProviderFromRequest } from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  // Forward the authentication from the incoming request headers
  const authProvider = forwardImsAuthProviderFromRequest(params);

  // Use the forwarded credentials in downstream API calls
  const response = await fetch("https://api.adobe.io/some-endpoint", {
    headers: await authProvider.getHeaders(),
  });

  return { statusCode: 200, body: await response.json() };
};
```

#### From Various Sources

For more flexibility, use `getForwardedImsAuthProvider` while specifying the credential source:

```typescript
import { getForwardedImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

// From a params object (e.g. runtime action parameters)
const provider1 = getForwardedImsAuthProvider({
  from: "params",
  params: {
    AIO_COMMERCE_IMS_AUTH_TOKEN: "my-token",
    AIO_COMMERCE_IMS_AUTH_API_KEY: "my-api-key",
  },
});

// From raw headers (e.g. from an HTTP request)
const provider2 = getForwardedImsAuthProvider({
  from: "headers",
  headers: {
    authorization: "Bearer my-token",
    "x-api-key": "my-api-key",
  },
});

// From explicit credentials (e.g. from environment variables or cache)
const provider3 = getForwardedImsAuthProvider({
  from: "credentials",
  accessToken: process.env.ACCESS_TOKEN,
  apiKey: process.env.API_KEY,
});

// From an async getter (e.g. fetch from secret manager)
const provider4 = getForwardedImsAuthProvider({
  from: "getter",
  getHeaders: async () => {
    const token = await secretManager.getSecret("ims-token");
    return { Authorization: `Bearer ${token}` };
  },
});

// Use any provider the same way
const token = await provider1.getAccessToken();
const headers = await provider1.getHeaders();
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

**Forwarded IMS Token** (fallback when full IMS/Integration params are not present):
| Parameter Key | Description |
|---------------|-------------|
| `AIO_COMMERCE_IMS_AUTH_TOKEN` | Pre-created IMS access token (required) |
| `AIO_COMMERCE_IMS_AUTH_API_KEY` | API key for downstream calls (optional) |

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

#### How Detection Works

The resolver checks parameters in the following order:

1. **Full IMS parameters** - If all IMS parameters are present, returns IMS auth with `strategy: "ims"`
2. **Integration parameters** - If all Integration parameters are present, returns Integration auth with `strategy: "integration"`
3. **Forwarded IMS token** - If `AIO_COMMERCE_IMS_AUTH_TOKEN` is present, returns a forwarded IMS auth provider with `strategy: "ims"`

If none of these sets are complete, it throws an error.

> [!TIP]
> If you need to work with a specific authentication type, use the provider-specific methods (`getImsAuthProvider` or `getIntegrationAuthProvider`) along with their assertion functions (`assertImsAuthParams` or `assertIntegrationAuthParams`) as shown in the sections above.

## Best Practices

1. **Use `resolveAuthParams` for flexibility** - Automatically detects auth type, making your code work with both IMS and Integration auth
2. **Use specific providers when needed** - Use `getImsAuthProvider` or `getIntegrationAuthProvider` with their respective `assert*` functions when you need to enforce a specific auth type
3. **Use forwarding for proxy patterns** - When your action receives authenticated requests and needs to call downstream services, use `forwardImsAuthProviderFromParams`, `forwardImsAuthProviderFromRequest`, or `getForwardedImsAuthProvider` to pass credentials without regenerating tokens
4. **Handle errors gracefully** - Catch and properly handle validation and authentication errors
