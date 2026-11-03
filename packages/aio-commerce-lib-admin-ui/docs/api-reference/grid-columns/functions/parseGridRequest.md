# `parseGridRequest()`

```ts
function parseGridRequest(input: unknown): {
  gridType:
    | "order"
    | "product"
    | "customer"
    | "invoice"
    | "creditmemo"
    | "shipment"
    | "newsletter";
  ids: string[];
  requestId: string;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/requests/presets.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-admin-ui/source/grid-columns/requests/presets.ts#L34)

Parses and validates the JSON body Commerce POSTs to a grid column handler.

Throws a `CommerceSdkValidationError` if the input is malformed.

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `input`   | `unknown` |

## Returns

```ts
{
  gridType:   | "order"
     | "product"
     | "customer"
     | "invoice"
     | "creditmemo"
     | "shipment"
     | "newsletter";
  ids: string[];
  requestId: string;
}
```

### gridType

```ts
gridType:
  | "order"
  | "product"
  | "customer"
  | "invoice"
  | "creditmemo"
  | "shipment"
  | "newsletter" = GridTypeSchema;
```

### ids

```ts
ids: string[];
```

### requestId

```ts
requestId: string;
```

## Example

```ts
import { parseGridRequest } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";

export async function main(params: unknown) {
  const { requestId, gridType, ids } = parseGridRequest(params);
  // ...
}
```
