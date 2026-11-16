# `hasExternalEvents()`

```ts
function hasExternalEvents<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { eventing: NonNullable<T["eventing"]> } & {
  eventing: EventsConfig<T>["eventing"] & {
    external: NonNullable<EventsConfig<T>["eventing"]["external"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:382](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L382)

Check if config has external event sources.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { eventing: NonNullable<T["eventing"]> } & { eventing: EventsConfig<T>["eventing"] & { external: NonNullable<EventsConfig<T>["eventing"]["external"]> } }`
