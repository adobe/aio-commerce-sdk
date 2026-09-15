# `SearchCriteria`

```ts
type SearchCriteria = Pagination & {
  filterGroups?: SearchFilter[][];
  sortOrders?: SortOrder[];
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts#L110)

A declarative description of an Adobe Commerce REST search query.

Serialize it with [buildSearchCriteria](../functions/buildSearchCriteria.md).

## Type Declaration

### filterGroups?

```ts
optional filterGroups?: SearchFilter[][];
```

The filters to apply. The outer array is AND-ed together, while the filters in each inner array are OR-ed.

### sortOrders?

```ts
optional sortOrders?: SortOrder[];
```

The sorts to apply, in order of precedence.
