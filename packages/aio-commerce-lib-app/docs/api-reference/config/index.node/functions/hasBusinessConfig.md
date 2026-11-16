# `hasBusinessConfig()`

```ts
function hasBusinessConfig<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { businessConfig: NonNullable<T["businessConfig"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L38)

Check if config has business config.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { businessConfig: NonNullable<T["businessConfig"]> }`
