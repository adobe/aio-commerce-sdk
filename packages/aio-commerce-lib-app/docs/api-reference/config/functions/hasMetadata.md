# `hasMetadata()`

```ts
function hasMetadata<T>(
  config: T,
): config is T & { metadata: NonNullable<T["metadata"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/metadata.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/metadata.ts#L83)

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
