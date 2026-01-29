# `@adobe/aio-commerce-lib-api` Documentation

## Overview

The `@adobe/aio-commerce-lib-api` package provides:

- **HTTP Clients**: Pre-configured Ky-based HTTP clients for Adobe Commerce and Adobe I/O Events
- **API Client Builder**: A flexible system for binding API functions to HTTP clients
- **Authentication Support**: Built-in integration with `@adobe/aio-commerce-lib-auth` for both IMS and OAuth authentication
- **Transformation Utilities**: Response transformation hooks for data normalization
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Reference

See the [API Reference](api-reference/README.md) for more details.

## How to use

### Creating HTTP Clients

#### Adobe Commerce HTTP Client (SaaS)

```typescript
import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";

const commerceClient = new AdobeCommerceHttpClient({
  config: {
    baseUrl: "https://api.commerce.adobe.com",
    flavor: "saas",
  },

  auth: {
    // IMS auth params
    clientId: "your-client-id",
    clientSecrets: ["your-client-secret"],
    technicalAccountId: "your-technical-account-id",
    technicalAccountEmail: "your-technical-account-email",
    imsOrgId: "your-ims-org-id",
  },
});
```

#### Adobe Commerce HTTP Client (PaaS)

PaaS supports both IMS and Integration authentication:

**With Integration Auth:**

```typescript
import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";

const commerceClient = new AdobeCommerceHttpClient({
  config: {
    baseUrl: "https://your-commerce-instance.com",
    flavor: "paas",
  },

  auth: {
    // Integration auth params
    accessToken: "your-access-token",
    accessTokenSecret: "your-access-token-secret",
    consumerKey: "your-consumer-key",
    consumerSecret: "your-consumer-secret",
  },
});
```

**With IMS Auth:**

```typescript
const commerceClient = new AdobeCommerceHttpClient({
  config: {
    baseUrl: "https://your-commerce-instance.com",
    flavor: "paas",
  },

  auth: {
    // IMS auth params
    clientId: "your-client-id",
    clientSecrets: ["your-client-secret"],
    technicalAccountId: "your-technical-account-id",
    technicalAccountEmail: "your-technical-account-email",
    imsOrgId: "your-ims-org-id",
  },
});
```

#### Adobe I/O Events HTTP Client

```typescript
import { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";

const ioEventsClient = new AdobeIoEventsHttpClient({
  auth: {
    // IMS auth params
    clientId: "your-client-id",
    clientSecrets: ["your-client-secret"],
    technicalAccountId: "your-technical-account-id",
    technicalAccountEmail: "your-technical-account-email",
    imsOrgId: "your-ims-org-id",
  },
  config: {
    baseUrl: "https://api.adobe.io/events", // optional, this is the default
  },
});
```

### Resolving Client Parameters from Runtime Actions

For App Builder runtime actions, you can use `resolveCommerceHttpClientParams` to automatically resolve client parameters from action inputs:

**Example: SaaS with IMS Auth**

```yaml
# app.config.yaml
actions:
  my-action:
    function: src/actions/my-action/index.js
    inputs:
      AIO_COMMERCE_API_BASE_URL: $AIO_COMMERCE_API_BASE_URL # e.g., https://api.commerce.adobe.com/tenant
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: $AIO_COMMERCE_AUTH_IMS_CLIENT_ID
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: $AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS
      AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: $AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID
      AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: $AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL
      AIO_COMMERCE_AUTH_IMS_ORG_ID: $AIO_COMMERCE_AUTH_IMS_ORG_ID
      AIO_COMMERCE_AUTH_IMS_SCOPES: $AIO_COMMERCE_AUTH_IMS_SCOPES
```

```typescript
// src/actions/my-action/index.js
import {
  resolveCommerceHttpClientParams,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-lib-api/commerce";

export const main = async function (params) {
  const clientParams = resolveCommerceHttpClientParams(params);
  // Resolves to: { config: { flavor: "saas", baseUrl: "..." }, auth: { ... ImsAuthParams } }

  const client = new AdobeCommerceHttpClient(clientParams);
  return await client.get("products").json();
};
```

**Example: PaaS with Integration Auth**

```yaml
# app.config.yaml
actions:
  my-action:
    function: src/actions/my-action/index.js
    inputs:
      AIO_COMMERCE_API_BASE_URL: $AIO_COMMERCE_API_BASE_URL # e.g., https://my-store.com

      # For Integration auth:
      AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: $AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY
      AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: $AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET
      AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: $AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN
      AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET: $AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET
      # Or use IMS auth params instead (same as SaaS example above)
```

```typescript
// src/actions/my-action/index.js
import {
  resolveCommerceHttpClientParams,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-lib-api/commerce";

export const main = async function (params) {
  const clientParams = resolveCommerceHttpClientParams(params);
  // Resolves to: { config: { flavor: "paas", baseUrl: "..." }, auth: { ... IntegrationAuthParams } }

  const client = new AdobeCommerceHttpClient(clientParams);
  return await client.get("rest/V1/products").json();
};
```

The resolver automatically detects flavor from the URL and auth type from the provided parameters. Define actual values in your `.env` file.

### Creating API Clients

The `ApiClient` class allows you to bind API functions to HTTP clients, creating a clean interface for your API operations:

```typescript
import {
  ApiClient,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-lib-api";

const getProduct = async (client: AdobeCommerceHttpClient, sku: string) => {
  return client.get(`products/${sku}`).json();
};

const updateProduct = async (
  client: AdobeCommerceHttpClient,
  sku: string,
  data: ProductData,
) => {
  return client.put(`products/${sku}`, { json: data }).json();
};

// Create the API client
const commerceHttpClient = new AdobeCommerceHttpClient({
  /* ... */
});

const commerceApiClient = ApiClient.create(commerceHttpClient, {
  getProduct,
  updateProduct,
});

// Use the API client
const product = await commerceApiClient.getProduct("test-sku");
const updated = await commerceApiClient.updateProduct("test-sku", {
  name: "Updated Product",
});
```

### Forwarding IMS Authentication

When your action receives a pre-existing IMS token (e.g., from an upstream service or API Gateway), you can forward it to downstream API calls using the `tryForwardAuthProvider` option:

```yaml
# app.config.yaml
actions:
  my-action:
    function: src/actions/my-action/index.js
    inputs:
      AIO_COMMERCE_API_BASE_URL: $AIO_COMMERCE_API_BASE_URL
      AIO_COMMERCE_AUTH_IMS_TOKEN: $AIO_COMMERCE_AUTH_IMS_TOKEN # Pre-existing token
      AIO_COMMERCE_AUTH_IMS_API_KEY: $AIO_COMMERCE_AUTH_IMS_API_KEY # Optional
```

```typescript
// src/actions/my-action/index.js
import {
  resolveCommerceHttpClientParams,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-lib-api/commerce";

export const main = async function (params) {
  // Use tryForwardAuthProvider to forward the pre-existing token
  const clientParams = resolveCommerceHttpClientParams(params, {
    tryForwardAuthProvider: true,
  });
  const client = new AdobeCommerceHttpClient(clientParams);

  return await client.get("products").json();
};
```

When `tryForwardAuthProvider: true` is set, the resolver will use `forwardImsAuthProvider` from `@adobe/aio-commerce-lib-auth` to detect credentials from:

1. **Params token** - `AIO_COMMERCE_AUTH_IMS_TOKEN` (and optionally `AIO_COMMERCE_AUTH_IMS_API_KEY`)
2. **HTTP headers** - `Authorization` header in `__ow_headers`

This is useful for:

- **Proxy patterns**: When your action acts as a proxy and needs to forward the caller's credentials
- **Token injection**: When tokens are injected by an API Gateway or upstream service
- **Testing**: When you want to use a specific token without full IMS configuration

The same pattern works for I/O Events:

```typescript
import {
  resolveIoEventsHttpClientParams,
  AdobeIoEventsHttpClient,
} from "@adobe/aio-commerce-lib-api/io-events";

export const main = async function (params) {
  const clientParams = resolveIoEventsHttpClientParams(params, {
    tryForwardAuthProvider: true,
  });
  const client = new AdobeIoEventsHttpClient(clientParams);

  return await client.get("events").json();
};
```

> [!NOTE]
> By default (`tryForwardAuthProvider: false`), the resolver uses `resolveAuthParams` which requires full IMS or Integration auth parameters. Set `tryForwardAuthProvider: true` explicitly when you want to forward pre-existing tokens.

### Custom Auth Providers

You can also use pre-initialized auth providers:

```typescript
import { getImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

const authProvider = getImsAuthProvider({
  clientId: "...",
  clientSecrets: ["..."],
  // ...
});

const client = new AdobeIoEventsHttpClient({
  auth: authProvider, // Use the provider directly
});
```

### Advanced Usage

#### Extending HTTP Clients

HTTP clients can be extended with additional options:

```typescript
const extendedClient = commerceClient.extend({
  headers: {
    "X-Custom-Header": "value",
  },
  retry: {
    limit: 5,
    methods: ["get", "post"],
  },
});
```

#### Custom Fetch Options

You can provide custom fetch options when creating HTTP clients:

```typescript
const client = new AdobeCommerceHttpClient({
  config: {
    /* ... */
  },
  auth: {
    /* ... */
  },
  fetchOptions: {
    timeout: 30000, // 30 seconds
    headers: {
      "X-Custom-Header": "value",
    },
    hooks: {
      beforeRequest: [
        (request) => {
          console.log("Making request to:", request.url);
        },
      ],
    },
  },
});
```
