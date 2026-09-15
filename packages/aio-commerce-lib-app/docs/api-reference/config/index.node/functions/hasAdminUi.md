# `hasAdminUi()`

```ts
function hasAdminUi<T extends AnyCommerceAppConfig>(
  config: T,
): config is AdminUiConfig<T>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:452](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L452)

Check whether the config declares at least one Admin UI component (menu, grid
columns, mass actions, view buttons, or custom ACL resources). A component-less `adminUi` block is
treated as absent — it registers nothing.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type |
| --------- | ---- |
| `config`  | `T`  |

## Returns

`config is AdminUiConfig<T>`
