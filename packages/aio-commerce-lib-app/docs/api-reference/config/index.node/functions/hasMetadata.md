# `hasMetadata()`

```ts
function hasMetadata<T>(
  config: T,
): config is T & { metadata: NonNullable<T["metadata"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/metadata.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/metadata.ts#L82)

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
