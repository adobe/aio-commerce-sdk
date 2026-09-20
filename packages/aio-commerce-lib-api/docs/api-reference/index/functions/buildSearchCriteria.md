# `buildSearchCriteria()`

```ts
function buildSearchCriteria(criteria: SearchCriteria): URLSearchParams;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/serialize.ts:120](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/serialize.ts#L120)

Serializes [SearchCriteria](../type-aliases/SearchCriteria.md) into the `searchCriteria[...]` query parameters that
Adobe Commerce REST search endpoints expect.

The result can be passed straight to the `searchParams` option of any request made with the SDK's HTTP clients.

## Parameters

| Parameter  | Type                                                  | Description                       |
| ---------- | ----------------------------------------------------- | --------------------------------- |
| `criteria` | [`SearchCriteria`](../type-aliases/SearchCriteria.md) | The search criteria to serialize. |

## Returns

`URLSearchParams`

## Example

```typescript
const searchParams = buildSearchCriteria({
  filterGroups: [[{ field: "sku", value: "24-MB01" }]],
  pageSize: 20,
});

await client.get("products", { searchParams }).json();
```
