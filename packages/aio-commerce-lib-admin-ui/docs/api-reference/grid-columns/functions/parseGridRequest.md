# `parseGridRequest()`

```ts
function parseGridRequest(input: unknown): {
  gridType: "order" | "product" | "customer";
  ids: string[];
  requestId: string;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/requests/presets.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/grid-columns/requests/presets.ts#L34)

Parses and validates the JSON body Commerce POSTs to a grid column handler.

Throws a `CommerceSdkValidationError` if the input is malformed.

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `input`   | `unknown` |

## Returns

```ts
{
  gridType: "order" | "product" | "customer";
  ids: string[];
  requestId: string;
}
```

### gridType

```ts
gridType: "order" | "product" | "customer" = GridTypeSchema;
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
