---
title: Getting Started
description: Install the Adobe Commerce SDK for App Builder and make your first API call in minutes.
---

## Installation

Install the complete SDK with a single package:

```shell
npm install @adobe/aio-commerce-sdk
```

Or install only the packages you need:

```shell
npm install @adobe/aio-commerce-lib-auth @adobe/aio-commerce-lib-api
```

## First import

The meta-package re-exports everything from all individual libraries:

```typescript
import {
  resolveAuthParams,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-sdk";
```

You can also import directly from individual packages for better tree-shaking:

```typescript
import { resolveAuthParams } from "@adobe/aio-commerce-lib-auth";
import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
```

## Minimal working example

The following example shows a complete App Builder runtime action that authenticates with IMS and fetches products from a SaaS Commerce instance:

```typescript
import {
  resolveCommerceHttpClientParams,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-lib-api/commerce";

export const main = async function (params) {
  const clientParams = resolveCommerceHttpClientParams(params);
  const client = new AdobeCommerceHttpClient(clientParams);

  const products = await client.get("products").json();
  return { statusCode: 200, body: products };
};
```

Configure the required environment variables in your `app.config.yaml`:

```yaml
actions:
  my-action:
    function: src/actions/my-action/index.js
    inputs:
      AIO_COMMERCE_API_BASE_URL: $AIO_COMMERCE_API_BASE_URL
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: $AIO_COMMERCE_AUTH_IMS_CLIENT_ID
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: $AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS
      AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: $AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID
      AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: $AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL
      AIO_COMMERCE_AUTH_IMS_ORG_ID: $AIO_COMMERCE_AUTH_IMS_ORG_ID
      AIO_COMMERCE_AUTH_IMS_SCOPES: $AIO_COMMERCE_AUTH_IMS_SCOPES
```

## Next steps

- Read the [Installation guide](/aio-commerce-sdk/guides/installation/) for meta-package vs individual package guidance
- Explore [package documentation](/aio-commerce-sdk/packages/aio-commerce-lib-auth/) for in-depth usage examples
