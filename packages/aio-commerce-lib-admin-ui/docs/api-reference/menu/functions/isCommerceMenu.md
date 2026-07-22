# `isCommerceMenu()`

```ts
function isCommerceMenu(
  menu: string,
): menu is
  | "catalog"
  | "customers"
  | "marketing"
  | "content"
  | "reports"
  | "sales"
  | "stores"
  | "system";
```

Defined in: [aio-commerce-lib-admin-ui/source/menu/paths.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/menu/paths.ts#L53)

Returns true if the given string is a known Commerce Admin menu ID.

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `menu`    | `string` |

## Returns

menu is "catalog" \| "customers" \| "marketing" \| "content" \| "reports" \| "sales" \| "stores" \| "system"
