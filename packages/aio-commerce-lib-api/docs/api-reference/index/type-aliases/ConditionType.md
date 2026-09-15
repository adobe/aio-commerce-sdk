# `ConditionType`

```ts
type ConditionType =
  | "eq"
  | "neq"
  | "like"
  | "nlike"
  | "in"
  | "nin"
  | "gt"
  | "gteq"
  | "lt"
  | "lteq"
  | "from"
  | "to"
  | "finset"
  | "nfinset"
  | "regexp"
  | "seq"
  | "sneq"
  | "null"
  | "notnull";
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-api/source/lib/commerce/search-criteria/types.ts#L43)

The condition applied by a [SearchFilter](SearchFilter.md). Defaults to `eq` when omitted.

- `eq` / `neq` — equals, not equals
- `like` / `nlike` — SQL `LIKE`; the value must include its own `%` wildcards
- `in` / `nin` — membership; array values are comma-joined on serialization
- `gt` / `gteq` / `lt` / `lteq` — numeric and date comparisons
- `from` / `to` — the bounds of a range, normally used as a pair
- `finset` / `nfinset` — a value within a set (Commerce multi-select attributes)
- `regexp` — matches a MySQL regular expression
- `seq` / `sneq` — string equals; Commerce turns these into a null check when the value is an empty string,
  and into `eq` / `neq` otherwise
- `null` / `notnull` — nullness; the SQL ignores the value, but supplying one is what makes `null` work on a
  non-static EAV attribute
