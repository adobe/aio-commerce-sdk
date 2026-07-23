# `GridSuccessBody`

```ts
type GridSuccessBody = {
  data: Record<string, GridRow> & {
     *?: GridRow;
  };
};
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts#L23)

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

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/grid-columns/responses/types.ts#L24)

#### Type Declaration

##### \*?

```ts
optional *?: GridRow;
```
