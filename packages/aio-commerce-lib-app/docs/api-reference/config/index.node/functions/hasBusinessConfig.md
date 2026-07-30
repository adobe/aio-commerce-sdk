# `hasBusinessConfig()`

```ts
function hasBusinessConfig<T>(
  config: T,
): config is T & { businessConfig: NonNullable<T["businessConfig"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L35)

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
