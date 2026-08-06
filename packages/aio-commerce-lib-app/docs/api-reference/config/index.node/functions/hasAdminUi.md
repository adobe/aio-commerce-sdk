# `hasAdminUi()`

```ts
function hasAdminUi<T>(config: T): config is AdminUiConfig<T>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:288](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L288)

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
