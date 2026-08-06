# `hasCustomInstallation()`

```ts
function hasCustomInstallation<T>(
  config: T,
): config is T & { installation: NonNullable<T["installation"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:136](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L136)

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
