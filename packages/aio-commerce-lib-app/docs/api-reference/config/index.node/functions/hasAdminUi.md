# `hasAdminUi()`

```ts
function hasAdminUi<T>(config: T): config is AdminUiConfig<T>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:288](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L288)

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
