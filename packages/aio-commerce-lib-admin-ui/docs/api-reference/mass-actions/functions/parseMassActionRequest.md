# `parseMassActionRequest()`

```ts
function parseMassActionRequest(input: unknown): {
  gridType: "order" | "product" | "customer";
  requestId: string;
  selectedIds: string[];
};
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts#L43)

Parses and validates the JSON body Commerce POSTs to a worker mass action handler.

Throws a `CommerceSdkValidationError` if the input is malformed.

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `input`   | `unknown` |

## Returns

```ts
{
  gridType: "order" | "product" | "customer";
  requestId: string;
  selectedIds: string[];
}
```

### gridType

```ts
gridType: "order" | "product" | "customer" = MassActionGridTypeSchema;
```

### requestId

```ts
requestId: string;
```

### selectedIds

```ts
selectedIds: string[];
```

## Example

```ts
import { parseMassActionRequest } from "@adobe/aio-commerce-lib-admin-ui/mass-actions";

export async function main(params: unknown) {
  const { requestId, gridType, selectedIds } = parseMassActionRequest(params);
  // process selectedIds...
}
```
