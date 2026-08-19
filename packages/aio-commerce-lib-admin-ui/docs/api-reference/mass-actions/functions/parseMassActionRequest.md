# `parseMassActionRequest()`

```ts
function parseMassActionRequest(input: unknown): {
  gridType: "order" | "product" | "customer";
  requestId: string;
  selectedIds: string[];
};
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts#L43)

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
