# `hasEventing()`

```ts
function hasEventing<T>(
  config: T,
): config is T & { eventing: NonNullable<T["eventing"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:395](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L395)

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
