# `hasExternalEvents()`

```ts
function hasExternalEvents<T>(config: T): config is T & {
  eventing: NonNullable<T["eventing"]>;
} & {
  eventing: EventsConfig<T>["eventing"] & {
    external: NonNullable<EventsConfig<T>["eventing"]["external"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:382](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L382)

Check if config has external event sources.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { eventing: NonNullable<T["eventing"]> } & { eventing: EventsConfig<T>["eventing"] & { external: NonNullable<EventsConfig<T>["eventing"]["external"]> } }`
