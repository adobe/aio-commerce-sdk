# `@aio-commerce-sdk/aio-commerce-lib-api` Documentation

## Overview

The `@aio-commerce-sdk/aio-commerce-lib-api` package provides:

- **HTTP Clients**: Pre-configured Ky-based HTTP clients for Adobe Commerce and Adobe I/O Events
- **API Client Builder**: A flexible system for binding API functions to HTTP clients
- **Authentication Support**: Built-in integration with `@adobe/aio-commerce-lib-auth` for both IMS and OAuth authentication
- **Transformation Utilities**: Response transformation hooks for data normalization
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Reference

See the [API Reference](./api-reference/README.md) for more details.

## How to use

### Creating HTTP Clients

#### Adobe Commerce HTTP Client (SaaS)

```typescript
import { AdobeCommerceHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";

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
    environment: "prod",
  },
});
```

#### Adobe Commerce HTTP Client (PaaS)

```typescript
import { AdobeCommerceHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";

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

#### Adobe I/O Events HTTP Client

```typescript
import { AdobeIoEventsHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";

const ioEventsClient = new AdobeIoEventsHttpClient({
  auth: {
    // IMS auth params
    clientId: "your-client-id",
    clientSecrets: ["your-client-secret"],
    technicalAccountId: "your-technical-account-id",
    technicalAccountEmail: "your-technical-account-email",
    imsOrgId: "your-ims-org-id",
    environment: "prod",
  },
  config: {
    baseUrl: "https://api.adobe.io/events", // optional, this is the default
  },
});
```

### Creating API Clients

The `ApiClient` class allows you to bind API functions to HTTP clients, creating a clean interface for your API operations:

```typescript
import {
  ApiClient,
  AdobeCommerceHttpClient,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

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
import { buildCamelCaseKeysResponseHook } from "@aio-commerce-sdk/aio-commerce-lib-api/utils/transformations";

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
