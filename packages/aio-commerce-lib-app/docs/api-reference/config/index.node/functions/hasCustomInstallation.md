# `hasCustomInstallation()`

```ts
function hasCustomInstallation<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { installation: NonNullable<T["installation"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/installation.ts:133](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/config/schema/installation.ts#L133)

Check if config has custom installation settings.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { installation: NonNullable<T["installation"]> }`
