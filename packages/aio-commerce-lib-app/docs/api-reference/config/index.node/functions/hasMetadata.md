# `hasMetadata()`

```ts
function hasMetadata<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { metadata: NonNullable<T["metadata"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/metadata.ts:86](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/metadata.ts#L86)

Check if config has metadata.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { metadata: NonNullable<T["metadata"]> }`
