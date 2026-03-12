# `@adobe/aio-commerce-lib-webhooks`

> [!WARNING]
> This package is a work in progress and is not yet ready for use. You may be able to install it, but if you do, expect breaking changes.

This package provides an interface to interact with the Adobe Commerce Webhooks API.

## Installation

```shell
pnpm add @adobe/aio-commerce-lib-webhooks
```

## Usage

```typescript
import { createCommerceWebhooksApiClient } from "@adobe/aio-commerce-lib-webhooks";

const client = createCommerceWebhooksApiClient({
  config: {
    baseUrl: "https://my-commerce-instance.com",
    flavor: "paas",
  },
  auth: {
    /* IMS or Integration auth params */
  },
});

// List subscribed webhooks
const webhooks = await client.getWebhookList();

// Subscribe a webhook
await client.subscribeWebhook({
  webhook_method: "observer.catalog_product_save_after",
  webhook_type: "after",
  batch_name: "my_batch",
  hook_name: "my_hook",
  url: "https://my-app.com/webhook",
});
```
