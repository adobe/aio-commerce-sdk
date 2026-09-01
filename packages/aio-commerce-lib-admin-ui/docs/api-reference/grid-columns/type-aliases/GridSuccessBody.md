# `GridSuccessBody`

```ts
type GridSuccessBody = {
  data: Record<string, GridRow> & {
     *?: GridRow;
  };
};
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts#L23)

Success body returned to Commerce.

The `"*"` entry supplies default cell values that Commerce applies to IDs
missing from `data` and to cells whose returned value does not satisfy the
declared `type` on the registration.

## Properties

### data

```ts
data: Record<string, GridRow> & {
  *?: GridRow;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts#L24)

#### Type Declaration

##### \*?

```ts
optional *?: GridRow;
```
