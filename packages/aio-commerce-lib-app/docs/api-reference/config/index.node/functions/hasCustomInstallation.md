# `hasCustomInstallation()`

```ts
function hasCustomInstallation<T>(
  config: T,
): config is T & { installation: NonNullable<T["installation"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:136](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L136)

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
