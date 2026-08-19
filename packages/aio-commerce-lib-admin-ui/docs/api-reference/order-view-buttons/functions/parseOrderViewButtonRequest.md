# `parseOrderViewButtonRequest()`

```ts
function parseOrderViewButtonRequest(input: unknown): {
  id: string;
  orderId: string;
  requestId: string;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts#L45)

Parses and validates the JSON body Commerce POSTs to an order view button handler.

Throws a `CommerceSdkValidationError` if the input is malformed.

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `input`   | `unknown` |

## Returns

```ts
{
  id: string;
  orderId: string;
  requestId: string;
}
```

### id

```ts
id: string;
```

### orderId

```ts
orderId: string;
```

### requestId

```ts
requestId: string;
```

## Example

```ts
import { parseOrderViewButtonRequest } from "@adobe/aio-commerce-lib-admin-ui/order-view-buttons";

export async function main(params: unknown) {
  const { requestId, id, orderId } = parseOrderViewButtonRequest(params);
  // id identifies which button was clicked
  // orderId is the order currently being viewed
  // ...
}
```
