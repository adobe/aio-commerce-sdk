# `@adobe/aio-commerce-lib-auth` Documentation

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

For OAuth Server-to-Server credentials in an App Builder action, use the
`include-ims-credentials: true` annotation and resolve the injected credentials with
`resolveImsAuthParams` as shown below. Avoid manually wiring `AIO_COMMERCE_AUTH_IMS_*`
credentials; that fallback is deprecated and is planned for removal in a future major release.

```typescript
import {
  getImsAuthProvider,
  resolveImsAuthParams,
} from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  const imsAuthProvider = getImsAuthProvider(resolveImsAuthParams(params));
  const headers = await imsAuthProvider.getHeaders();

  // Use headers in your API calls
  return { statusCode: 200 };
};
```

### OAuth Server-to-Server via the `include-ims-credentials` annotation

Annotate an action with `include-ims-credentials: true` in `app.config.yaml`. App Builder's
runtime injects the workspace's OAuth Server-to-Server credentials directly into the action's
`params`. This is the recommended way to provide IMS credentials; manually wiring
`AIO_COMMERCE_AUTH_IMS_*` inputs is deprecated and planned for removal in a future major release.

`resolveImsAuthParams` resolves the injected credentials. Its legacy fallback to manually-wired
`AIO_COMMERCE_AUTH_IMS_*` params remains temporarily for compatibility, but should not be used
for new actions.

```typescript
import {
  getImsAuthProvider,
  resolveImsAuthParams,
} from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  const authParams = resolveImsAuthParams(params);
  const authProvider = getImsAuthProvider(authParams);

  const headers = await authProvider.getHeaders();

  // Use headers in your API calls
  return { statusCode: 200 };
};
```

```yaml
# app.config.yaml
actions:
  my-action:
    function: src/actions/my-action/index.js
    annotations:
      include-ims-credentials: true
```

### Forwarding IMS Authentication

When building actions that receive authenticated requests and need to forward those credentials to downstream services, use the forwarding utilities. This is useful for proxy patterns or when chaining multiple services.

#### Auto-Detection with `forwardImsAuthProvider`

Use `forwardImsAuthProvider` to automatically detect the source of credentials:

```typescript
import { forwardImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

export const main = async function (params: Record<string, unknown>) {
  // Automatically detects credentials from:
  // 1. AIO_COMMERCE_AUTH_IMS_TOKEN param (if present)
  // 2. Authorization header in __ow_headers (fallback)
  const authProvider = forwardImsAuthProvider(params);

  // Use the forwarded credentials in downstream API calls
  const response = await fetch("https://api.adobe.io/some-endpoint", {
    headers: await authProvider.getHeaders(),
  });

  return { statusCode: 200, body: await response.json() };
};
```

The function tries sources in this order:

1. **Params token** - Looks for `AIO_COMMERCE_AUTH_IMS_TOKEN` (and optionally `AIO_COMMERCE_AUTH_IMS_API_KEY`) in the params object
2. **HTTP headers** - Falls back to `Authorization` header in `__ow_headers`

If neither source provides valid credentials, it throws an error.

#### Explicit Source with `getForwardedImsAuthProvider`

For more control, use `getForwardedImsAuthProvider` to explicitly specify the credential source:

```typescript
import { getForwardedImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

// From a params object (e.g. runtime action parameters)
const provider1 = getForwardedImsAuthProvider({
  from: "params",
  params: {
    AIO_COMMERCE_AUTH_IMS_TOKEN: "my-token",
    AIO_COMMERCE_AUTH_IMS_API_KEY: "my-api-key",
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

// From an async getter (e.g. fetch from secret manager)
const provider3 = getForwardedImsAuthProvider({
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

The `resolveAuthParams` function automatically detects and resolves authentication parameters from your runtime action inputs. It tries IMS authentication first, using the `include-ims-credentials` annotation (or the deprecated manually-wired IMS fallback), then falls back to Integration authentication if no IMS credentials can be resolved.

#### Required Parameters

**IMS Authentication** is resolved via `resolveImsAuthParams`. For new actions, add the
`include-ims-credentials: true` annotation; no credentials need to be wired into action inputs.

> [!CAUTION]
> Manually wiring `AIO_COMMERCE_AUTH_IMS_CLIENT_ID`, `AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS`,
> `AIO_COMMERCE_AUTH_IMS_ORG_ID`, `AIO_COMMERCE_AUTH_IMS_SCOPES`,
> `AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID`, `AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL`,
> `AIO_COMMERCE_AUTH_IMS_ENVIRONMENT`, or `AIO_COMMERCE_AUTH_IMS_CONTEXT` for OAuth
> Server-to-Server credentials is deprecated. Existing actions continue to work for now, but
> migrate them to the `include-ims-credentials` annotation before the next major release. This
> deprecation does not apply to `AIO_COMMERCE_AUTH_IMS_TOKEN` /
> `AIO_COMMERCE_AUTH_IMS_API_KEY` used to forward an existing token, or to
> `AIO_COMMERCE_AUTH_INTEGRATION_*` Commerce Integration credentials.

**Integration Authentication** continues to use the manually configured parameters (requires all
of these):

| Parameter Key                                       | Description               |
| --------------------------------------------------- | ------------------------- |
| `AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY`        | OAuth consumer key        |
| `AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET`     | OAuth consumer secret     |
| `AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN`        | OAuth access token        |
| `AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET` | OAuth access token secret |

> **Note:** In App Builder runtime actions, these parameters are typically provided via runtime action inputs in your `app.config.yaml` file and automatically passed to your action's `params` object.

> [!TIP]
> For forwarding pre-existing IMS tokens, use `forwardImsAuthProvider` with `AIO_COMMERCE_AUTH_IMS_TOKEN` instead. See [Forwarding IMS Authentication](#forwarding-ims-authentication).

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

The resolver tries strategies in the following order:

1. **IMS auth** - If IMS credentials can be resolved (via the `include-ims-credentials` annotation or legacy manually-wired params), returns IMS auth with `strategy: "ims"`
2. **Integration parameters** - If all Integration parameters are present, returns Integration auth with `strategy: "integration"`

If neither resolves, it throws an error.

> [!TIP]
> If you need to work with a specific authentication type, use the provider-specific methods (`getImsAuthProvider` or `getIntegrationAuthProvider`) along with their assertion functions (`assertImsAuthParams` or `assertIntegrationAuthParams`) as shown in the sections above.

> [!NOTE]
> For forwarding pre-existing IMS tokens (e.g., `AIO_COMMERCE_AUTH_IMS_TOKEN`), use `forwardImsAuthProvider` instead of `resolveAuthParams`.

## Best Practices

1. **Use `resolveAuthParams` for flexibility** - Automatically detects auth type, making your code work with both IMS and Integration auth
2. **Use specific providers when needed** - Use `getImsAuthProvider` or `getIntegrationAuthProvider` with their respective `assert*` functions when you need to enforce a specific auth type
3. **Use forwarding for proxy patterns** - When your action receives authenticated requests and needs to call downstream services, use `forwardImsAuthProvider` or `getForwardedImsAuthProvider` to pass credentials without regenerating tokens
4. **Handle errors gracefully** - Catch and properly handle validation and authentication errors

## CLI Commands

The library provides CLI commands to help manage authentication credentials. The legacy
`sync-ims-credentials` command is deprecated; use `include-ims-credentials: true` on each action
that needs OAuth Server-to-Server credentials.

```bash
# Sync IMS credentials from the current workspace context to the .env file
npx @adobe/aio-commerce-lib-auth sync-ims-credentials
```

### `sync-ims-credentials` (deprecated)

This command synchronizes IMS credentials from your current Adobe I/O workspace context (stored
in `.aio`) to `.env` using `AIO_COMMERCE_AUTH_IMS_*` variables. It remains available temporarily
for compatibility and will be removed in a future major release. Prefer the
`include-ims-credentials: true` action annotation instead.

**Legacy environment variable mapping:**

| Source (`.aio` context)   | Target (`.env` file)                            |
| ------------------------- | ----------------------------------------------- |
| `client_id`               | `AIO_COMMERCE_AUTH_IMS_CLIENT_ID`               |
| `client_secrets`          | `AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS`          |
| `technical_account_email` | `AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL` |
| `technical_account_id`    | `AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID`    |
| `scopes`                  | `AIO_COMMERCE_AUTH_IMS_SCOPES`                  |
| `ims_org_id`              | `AIO_COMMERCE_AUTH_IMS_ORG_ID`                  |

**Usage:**

> [!TIP]
> Existing projects may continue to use this command temporarily. For new and updated actions,
> use the `include-ims-credentials: true` annotation instead.

```bash
npx @adobe/aio-commerce-lib-auth sync-ims-credentials
```

**Example output:**

```
ℹ Syncing IMS credentials...
✔ IMS credentials successfully synced to AIO_COMMERCE_AUTH_IMS_* variables.
```
