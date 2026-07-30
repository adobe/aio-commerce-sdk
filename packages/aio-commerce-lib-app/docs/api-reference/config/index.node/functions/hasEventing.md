# `hasEventing()`

```ts
function hasEventing<T>(
  config: T,
): config is T & { eventing: NonNullable<T["eventing"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:395](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L395)

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
