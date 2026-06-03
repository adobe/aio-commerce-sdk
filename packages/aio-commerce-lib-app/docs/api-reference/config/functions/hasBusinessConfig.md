# `hasBusinessConfig()`

```ts
function hasBusinessConfig<T>(
  config: T,
): config is T & { businessConfig: NonNullable<T["businessConfig"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L38)

Check if config has business config.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { businessConfig: NonNullable<T["businessConfig"]> }`
