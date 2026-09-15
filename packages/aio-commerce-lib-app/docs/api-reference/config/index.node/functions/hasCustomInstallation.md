# `hasCustomInstallation()`

```ts
function hasCustomInstallation<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { installation: NonNullable<T["installation"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:136](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L136)

Check if config has custom installation settings.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { installation: NonNullable<T["installation"]> }`
