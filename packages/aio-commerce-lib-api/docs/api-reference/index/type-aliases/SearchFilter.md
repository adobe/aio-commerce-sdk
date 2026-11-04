# `SearchFilter`

```ts
type SearchFilter = {
  conditionType?: ConditionType;
  field: string;
  value?: SearchFilterValue | SearchFilterValue[];
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts#L68)

A single condition applied to a field of the searched entity.

## Properties

### conditionType?

```ts
conditionType?: ConditionType;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts#L81)

#### Default

```ts
"eq";
```

---

### field

```ts
field: string;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts:73](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts#L73)

The field to filter on. Kept as a bare `string` because Commerce attributes are per-installation and no exported
union could be complete.

---

### value?

```ts
value?:
  | SearchFilterValue
  | SearchFilterValue[];
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts#L78)

The value to compare against. Arrays are comma-joined, which is what the `in` and `nin` conditions expect.
