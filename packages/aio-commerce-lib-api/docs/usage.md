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

```typescript
import {
  resolveCommerceHttpClientParams,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-lib-api/commerce";

export const main = async function (params: Record<string, unknown>) {
  // Automatically resolves flavor (SaaS/PaaS) and auth from environment variables
  const clientParams = resolveCommerceHttpClientParams(params);
  const commerceClient = new AdobeCommerceHttpClient(clientParams);

  // Use the client
  const response = await commerceClient.get("products").json();
  return { statusCode: 200, body: response };
};
```

This function:

- Automatically detects SaaS vs PaaS based on the `AIO_COMMERCE_API_BASE_URL`
- Auto-resolves IMS or Integration authentication parameters
- Validates that SaaS uses only IMS auth (throws error if Integration auth is detected)
- Validates that all required parameters are present

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

### Response Transformations

The library provides utilities for transforming API responses:

```typescript
import { buildCamelCaseKeysResponseHook } from "@adobe/aio-commerce-lib-api/utils/transformations";

const client = new AdobeCommerceHttpClient({
  config: {
    /* ... */
  },
  auth: {
    /* ... */
  },
  fetchOptions: {
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  },
});

// Response keys will be automatically converted from snake_case to camelCase
const response = await client.get("products").json();
// { product_name: "..." } becomes { productName: "..." }
```

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
