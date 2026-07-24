# `hasMetadata()`

```ts
function hasMetadata<T>(
  config: T,
): config is T & { metadata: NonNullable<T["metadata"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/metadata.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/metadata.ts#L82)

Check if config has metadata.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { metadata: NonNullable<T["metadata"]> }`
