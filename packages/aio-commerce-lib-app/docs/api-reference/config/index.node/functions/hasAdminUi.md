# `hasAdminUi()`

```ts
function hasAdminUi<T>(config: T): config is AdminUiConfig<T>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:288](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L288)

Check if config has Admin UI configuration.

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
