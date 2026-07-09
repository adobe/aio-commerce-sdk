# `@adobe/aio-commerce-lib-webhooks` Documentation

## Overview

This package provides comprehensive tools for working with Adobe Commerce webhooks:

- **Webhooks API Client**: Programmatically manage webhook subscriptions (list, subscribe, unsubscribe)
- **Webhook Operations**: Create webhook operation responses (success, exception, add, replace, remove)
- **Action Response Integration**: Seamlessly combine webhook operations with HTTP action responses
- **Type Safety**: Full TypeScript support with discriminated union types and generics
- **Preset Functions**: Convenient helpers for common use cases
- **Builder Functions**: Flexible builders for advanced scenarios

For complete details on Adobe Commerce webhooks, see the [official documentation](https://developer.adobe.com/commerce/extensibility/webhooks/).

## Installation

```bash
npm install @adobe/aio-commerce-lib-webhooks
```

## Package Structure

This package uses **dedicated subpackage entries** for better tree-shaking and clearer API separation:

- **`@adobe/aio-commerce-lib-webhooks/api`** - Webhooks API client for managing webhook subscriptions
- **`@adobe/aio-commerce-lib-webhooks/responses`** - Webhook operations and HTTP response helpers

## Webhooks API Client

The `/api` export provides a client for managing webhook subscriptions in Adobe Commerce. This allows you to programmatically list, subscribe, and unsubscribe webhooks.

### Creating a Client

```typescript
import { createCommerceWebhooksApiClient } from "@adobe/aio-commerce-lib-webhooks/api";

const client = createCommerceWebhooksApiClient({
  config: {
    baseUrl: "https://my-commerce-instance.com",
    flavor: "paas", // or "saas"
  },
  auth: {
    /* IMS or Integration auth params */
  },
});
```

### Listing Webhooks

Get a list of all subscribed webhooks:

```typescript
const webhooks = await client.getWebhookList();

console.log(webhooks);
// [
//   {
//     webhook_id: "123",
//     webhook_method: "observer.catalog_product_save_after",
//     webhook_type: "after",
//     batch_name: "my_batch",
//     hook_name: "my_hook",
//     url: "https://my-app.com/webhook",
//     ...
//   }
// ]
```

### Subscribing to a Webhook

Subscribe to a new webhook event:

```typescript
await client.subscribeWebhook({
  webhook_method: "observer.catalog_product_save_after",
  webhook_type: "after",
  batch_name: "my_batch",
  hook_name: "my_hook",
  url: "https://my-app.com/webhook",
  headers: [
    {
      name: "Authorization",
      value: "Bearer token123",
    },
  ],
  fields: [
    {
      name: "product_id",
      value: "entity_id",
    },
  ],
});
```

### Unsubscribing from a Webhook

Remove a webhook subscription:

```typescript
await client.unsubscribeWebhook({
  webhook_id: "123",
});
```

### Getting Supported Webhooks

Get a list of all available webhook methods that Commerce supports:

```typescript
const supportedWebhooks = await client.getSupportedWebhookList();

console.log(supportedWebhooks);
// [
//   {
//     method: "observer.catalog_product_save_after",
//     description: "Triggered after a product is saved",
//     ...
//   },
//   ...
// ]
```

### Using Standalone Functions

You can also use the API functions directly without creating a client:

```typescript
import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import {
  getWebhookList,
  subscribeWebhook,
  unsubscribeWebhook,
  getSupportedWebhookList,
} from "@adobe/aio-commerce-lib-webhooks/api";

// Create an HTTP client
const httpClient = new AdobeCommerceHttpClient({
  config: {
    baseUrl: "https://my-commerce-instance.com",
    flavor: "paas",
  },
  auth: {
    /* auth params */
  },
});

// Use the standalone functions
const webhooks = await getWebhookList(httpClient);
const supportedWebhooks = await getSupportedWebhookList(httpClient);

await subscribeWebhook(httpClient, {
  webhook_method: "observer.catalog_product_save_after",
  webhook_type: "after",
  batch_name: "my_batch",
  hook_name: "my_hook",
  url: "https://my-app.com/webhook",
});

await unsubscribeWebhook(httpClient, {
  webhook_method: "observer.catalog_product_save_after",
  webhook_type: "after",
  batch_name: "my_batch",
  hook_name: "my_hook",
});
```

## Webhook Operations and Responses

The `/responses` export provides tools for building webhook handler responses, including both webhook operations and HTTP response wrappers.

### Understanding the Concepts

**Webhook Operations** tell Adobe Commerce what to do with the event data:

- `successOperation()` - Allow the process to continue unchanged
- `exceptionOperation()` - Block the process with an error message
- `addOperation()` - Add new data to the event
- `replaceOperation()` - Modify existing data in the event
- `removeOperation()` - Remove data from the event

**Action Responses** wrap operations in HTTP responses:

- `ok()` - Returns HTTP 200 with the operation(s) in the body
- Other status codes (4xx/5xx) indicate system/validation failures

**Example:**

```typescript
import {
  successOperation,
  ok,
} from "@adobe/aio-commerce-lib-webhooks/responses";

// Create an operation
const operation = successOperation();
// Returns: { op: "success" }

// Wrap it in an HTTP response
return ok(operation);
// Returns: { type: "success", statusCode: 200, body: { op: "success" } }
```

### Response Structure

Adobe Commerce webhooks expect:

- **HTTP 200** with operations = webhook succeeded, operations tell Commerce what to do
- **HTTP 4xx/5xx** = system/validation failures (not business logic blocks)

### Operation Types

#### 1. Success Operation

Allows the Commerce process to continue unchanged.

```typescript
import {
  successOperation,
  ok,
} from "@adobe/aio-commerce-lib-webhooks/responses";

export async function handleWebhook(params) {
  // Your validation logic here...
  return ok(successOperation());
}
```

#### 2. Exception Operation

Blocks the Commerce process with an error message.

```typescript
import {
  exceptionOperation,
  successOperation,
  ok,
} from "@adobe/aio-commerce-lib-webhooks/responses";

export async function validateStock(params) {
  const { product } = params;
  const stock = await checkInventory(product.sku);

  if (stock < product.quantity) {
    return ok(
      exceptionOperation(
        "The product cannot be added to the cart because it is out of stock",
      ),
    );
  }

  return ok(successOperation());
}
```

**With exception class:**

```typescript
return ok(
  exceptionOperation(
    "Insufficient inventory",
    "Magento\\Framework\\Exception\\LocalizedException",
  ),
);
```

#### 3. Add Operation

Adds new data to the event arguments.

**Basic usage:**

```typescript
import { addOperation, ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function addCustomShipping(params) {
  const customRate = await calculateShippingRate(params);

  return ok(
    addOperation(
      "result",
      {
        data: {
          amount: customRate.toString(),
          carrier_code: "custom_express",
          carrier_title: "Express Shipping",
          method_code: "express",
          method_title: "2-Day Express Delivery",
        },
      },
      "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
    ),
  );
}
```

**With type safety (generics):**

```typescript
type ShippingMethodData = {
  data: {
    amount: string;
    carrier_code: string;
    carrier_title: string;
    method_code: string;
    method_title: string;
  };
};

// TypeScript enforces the structure
return ok(
  addOperation<ShippingMethodData>("result", {
    data: {
      amount: "15.99",
      carrier_code: "custom_express",
      carrier_title: "Express Shipping",
      method_code: "express",
      method_title: "2-Day Express",
    },
  }),
);

// Type inference also works automatically
const operation = addOperation("result", { amount: 5, code: "test" });
// TypeScript knows operation.value has amount and code properties
```

#### 4. Replace Operation

Modifies existing values in the event arguments.

**Basic usage:**

```typescript
import {
  replaceOperation,
  successOperation,
  ok,
} from "@adobe/aio-commerce-lib-webhooks/responses";

export async function applyVipDiscount(params) {
  const isVip = await checkVipStatus(params.customer.id);

  if (isVip) {
    const discountedAmount = params.cart.shipping_amount * 0.5;
    return ok(
      replaceOperation(
        "result/shipping_methods/flatrate/amount",
        discountedAmount,
      ),
    );
  }

  return ok(successOperation());
}
```

**With type safety (generics):**

```typescript
type PriceData = {
  amount: number;
  currency: string;
  discount?: number;
};

// TypeScript enforces the structure
return ok(
  replaceOperation<PriceData>("result/price", {
    amount: 99.99,
    currency: "USD",
    discount: 10,
  }),
);

// Type inference works automatically
const operation = replaceOperation("result/config", { enabled: true });
// TypeScript knows operation.value has enabled property
```

#### 5. Remove Operation

Removes data from the event arguments.

```typescript
import {
  removeOperation,
  successOperation,
  ok,
} from "@adobe/aio-commerce-lib-webhooks/responses";

export async function restrictPaymentMethods(params) {
  // Remove cash on delivery for international orders
  if (params.shippingAddress.country !== "US") {
    return ok(removeOperation("result/payment_methods/cashondelivery"));
  }

  return ok(successOperation());
}
```

### Multiple Operations

You can return multiple operations in a single response. Operations are executed in the order they appear.

**Example - Add multiple shipping options:**

```typescript
import { addOperation, ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function addMultipleShippingOptions(params) {
  const expressRate = await calculateExpressRate(params.shippingAddress);
  const overnightRate = await calculateOvernightRate(params.shippingAddress);

  return ok([
    addOperation(
      "result",
      {
        data: {
          amount: expressRate.toString(),
          carrier_code: "custom_express",
          carrier_title: "Express Shipping",
          method_code: "express",
          method_title: "2-Day Express",
        },
      },
      "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
    ),
    addOperation(
      "result",
      {
        data: {
          amount: overnightRate.toString(),
          carrier_code: "custom_overnight",
          carrier_title: "Overnight Shipping",
          method_code: "overnight",
          method_title: "Next Day Delivery",
        },
      },
      "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
    ),
  ]);
}
```

**Example - Mix different operation types:**

```typescript
import {
  addOperation,
  replaceOperation,
  removeOperation,
  ok,
} from "@adobe/aio-commerce-lib-webhooks/responses";

export async function customizeCheckout(params) {
  return ok([
    // Add a custom shipping method
    addOperation("result/shipping_methods", {
      /* ... */
    }),
    // Update the shipping amount
    replaceOperation("result/shipping_methods/flatrate/amount", 5.99),
    // Remove an unwanted payment method
    removeOperation("result/payment_methods/cashondelivery"),
  ]);
}
```

## Reference

For complete API documentation and additional details, see:

- [Adobe Commerce Webhooks Documentation](https://developer.adobe.com/commerce/extensibility/webhooks/responses/)
- [API Reference](./api-reference/README.md)
