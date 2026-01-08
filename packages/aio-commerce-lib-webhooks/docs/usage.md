# `@adobe/aio-commerce-lib-webhooks` Documentation

> [!WARNING]
> This package is still under development and is not yet ready for use. You might be able to install it, but you may encounter breaking changes.

## Overview

This package provides utilities for building Adobe Commerce webhook responses:

- **Webhook Operations**: Create webhook operation responses (success, exception, add, replace, remove)
- **Action Response Integration**: Seamlessly combine webhook operations with HTTP action responses
- **Type Safety**: Full TypeScript support with discriminated union types
- **Preset Functions**: Convenient helpers for common use cases
- **Builder Functions**: Flexible builders for advanced scenarios

For complete details on Adobe Commerce webhooks, see the [official documentation](https://developer.adobe.com/commerce/extensibility/webhooks/responses/).

## Installation

```bash
npm install @adobe/aio-commerce-lib-webhooks
```

## Package Structure

This package uses **dedicated subpackage entries** for better tree-shaking and clearer API separation:

- **`@adobe/aio-commerce-lib-webhooks/operations`** - Webhook operation builders and presets
- **`@adobe/aio-commerce-lib-webhooks/responses`** - Webhook-optimized HTTP response helpers

## Basic Concepts

### Webhook Operations vs Action Responses

It's important to understand the distinction between these two concepts:

- **Webhook Operations** (`successOperation()`, `exceptionOperation()`, etc.): These create the operation objects that tell Adobe Commerce what to do with the event data. They go in the response **body**.

- **Action Responses** (`ok()`, `badRequest()`, etc.): These create the full HTTP response wrapper with status codes, headers, and body.

This package provides **webhook-optimized versions** of `ok()` and `created()` that automatically wrap operations in the response body, giving you a cleaner API:

**Example:**

```typescript
import {
  successOperation,
  addOperation,
  removeOperation,
} from "@adobe/aio-commerce-lib-webhooks/operations";
import { ok } from "@adobe/aio-commerce-lib-webhooks/responses";

// Webhook operation (body content)
const operation = successOperation();
// Returns: { op: "success" }

// Webhook-optimized response - clean and simple!
return ok(operation);
// Returns: { type: "success", statusCode: 200, body: { op: "success" } }

// Also works with arrays of operations
return ok([addOperation("result", data), removeOperation("result/old_field")]);
```

### Response Structure

Adobe Commerce webhooks expect:

- **HTTP 200** with webhook operations = webhook succeeded, operations tell Commerce what to do
- **HTTP 4xx/5xx** = system/validation failures (not business logic blocks)

## Quick Start

### Success Operation

Use when the webhook should allow the process to continue unchanged:

```typescript
import { successOperation } from "@adobe/aio-commerce-lib-webhooks/operations";
import { ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function main(params) {
  // Your validation logic here...

  // Allow process to continue
  return ok(successOperation());
}
```

### Exception Operation

Use when you need to block the Commerce process with an error:

```typescript
import {
  successOperation,
  exceptionOperation,
} from "@adobe/aio-commerce-lib-webhooks/operations";
import { ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function validateStock(params) {
  const { product } = params;

  const stock = await checkInventory(product.sku);

  if (stock < product.quantity) {
    // Block the process with an exception
    return ok(
      exceptionOperation(
        "The product cannot be added to the cart because it is out of stock",
      ),
    );
  }

  return ok(successOperation());
}
```

### Add Operation

Add new data to the event arguments:

```typescript
import { addOperation } from "@adobe/aio-commerce-lib-webhooks/operations";
import { ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function addCustomShipping(params) {
  const { cart, shippingAddress } = params;

  // Calculate custom shipping rate
  const customRate = await calculateShippingRate(cart, shippingAddress);

  // Add a new shipping method
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

// Response:
// {
//   type: "success",
//   statusCode: 200,
//   body: {
//     op: "add",
//     path: "result",
//     value: { data: { amount: "15.99", ... } },
//     instance: "Magento\\Quote\\Api\\Data\\ShippingMethodInterface"
//   }
// }
```

### Replace Operation

Modify existing values in the event arguments:

```typescript
import {
  replaceOperation,
  successOperation,
} from "@adobe/aio-commerce-lib-webhooks/operations";
import { ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function applyVipDiscount(params) {
  const { customer, cart } = params;

  const isVip = await checkVipStatus(customer.id);

  if (isVip) {
    // Replace shipping amount with discounted rate
    const discountedAmount = cart.shipping_amount * 0.5;

    return ok(
      replaceOperation(
        "result/shipping_methods/flatrate/amount",
        discountedAmount,
      ),
    );
  }

  return ok(successOperation());
}

// Response for VIP customer:
// {
//   type: "success",
//   statusCode: 200,
//   body: {
//     op: "replace",
//     path: "result/shipping_methods/flatrate/amount",
//     value: 7.5
//   }
// }
```

### Remove Operation

Remove data from the event arguments:

```typescript
import {
  removeOperation,
  successOperation,
} from "@adobe/aio-commerce-lib-webhooks/operations";
import { ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function restrictPaymentMethods(params) {
  const { shippingAddress } = params;

  // Remove cash on delivery for international orders
  if (shippingAddress.country !== "US") {
    return ok(removeOperation("result/payment_methods/cashondelivery"));
  }

  return ok(successOperation());
}
```

## Array of Operations

You can return multiple operations in a single webhook response. Operations are executed in the order they appear in the array.

### Multiple Add Operations

Add several items at once:

```typescript
import { addOperation } from "@adobe/aio-commerce-lib-webhooks/operations";
import { ok } from "@adobe/aio-commerce-lib-webhooks/responses";

export async function addMultipleShippingOptions(params) {
  const { cart, shippingAddress } = params;

  // Calculate multiple shipping rates
  const expressRate = await calculateExpressRate(shippingAddress);
  const overnightRate = await calculateOvernightRate(shippingAddress);

  // Return array of add operations - clean and simple!
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

// Response:
// {
//   type: "success",
//   statusCode: 200,
//   body: [
//     { op: "add", path: "result", value: {...}, instance: "..." },
//     { op: "add", path: "result", value: {...}, instance: "..." }
//   ]
// }
```

## Reference

For complete API documentation and additional details, see:

- [Adobe Commerce Webhooks Documentation](https://developer.adobe.com/commerce/extensibility/webhooks/responses/)
- [API Reference](./api-reference/README.md)
