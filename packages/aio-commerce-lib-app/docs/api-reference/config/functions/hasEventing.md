# `hasEventing()`

```ts
function hasEventing<T>(
  config: T,
): config is T & { eventing: NonNullable<T["eventing"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:372](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L372)

Check if config has any eventing configuration.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { eventing: NonNullable<T["eventing"]> }`
