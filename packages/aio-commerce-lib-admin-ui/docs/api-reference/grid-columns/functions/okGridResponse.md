# `okGridResponse()`

```ts
function okGridResponse(
  data: Record<string, GridRow>,
  defaults?: GridRow,
): SuccessResponse<GridSuccessBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/responses/presets.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/grid-columns/responses/presets.ts#L41)

Builds an HTTP 200 success response carrying the grid column data envelope
Commerce expects on the `commerce/backend-ui/2` wire contract.

## Parameters

| Parameter   | Type                                                          | Description                                                                                                                                           |
| ----------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`      | `Record`\<`string`, [`GridRow`](../type-aliases/GridRow.md)\> | Per-row cell values, keyed by entity ID.                                                                                                              |
| `defaults?` | [`GridRow`](../type-aliases/GridRow.md)                       | Default cell values applied by Commerce to IDs missing from `data` and to cells whose value does not satisfy the declared `type` on the registration. |

## Returns

`SuccessResponse`\<[`GridSuccessBody`](../type-aliases/GridSuccessBody.md)\>

## Example

```ts
return okGridResponse(
  {
    "000000001": { fulfillment_status: "shipped", risk_score: 12 },
    "000000002": { fulfillment_status: "pending", risk_score: 47 },
  },
  { fulfillment_status: "unknown", risk_score: 0 },
);
```
