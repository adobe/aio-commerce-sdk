# `buildSearchCriteriaRecord()`

```ts
function buildSearchCriteriaRecord(
  criteria: SearchCriteria,
): Record<string, string>;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/serialize.ts:132](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/serialize.ts#L132)

Serializes [SearchCriteria](../type-aliases/SearchCriteria.md) into a plain record of query parameters.

Prefer [buildSearchCriteria](buildSearchCriteria.md); this variant exists for the case where the search criteria has to be
merged with unrelated query parameters, which `URLSearchParams` does not make convenient.

## Parameters

| Parameter  | Type                                                  | Description                       |
| ---------- | ----------------------------------------------------- | --------------------------------- |
| `criteria` | [`SearchCriteria`](../type-aliases/SearchCriteria.md) | The search criteria to serialize. |

## Returns

`Record`\<`string`, `string`\>
