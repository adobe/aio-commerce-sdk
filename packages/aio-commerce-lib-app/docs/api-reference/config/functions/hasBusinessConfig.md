# `hasBusinessConfig()`

```ts
function hasBusinessConfig<T>(
  config: T,
): config is T & { businessConfig: NonNullable<T["businessConfig"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L35)

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
