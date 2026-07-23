# `hasCommerceEvents()`

```ts
function hasCommerceEvents<T>(config: T): config is T & {
  eventing: NonNullable<T["eventing"]>;
} & {
  eventing: EventsConfig<T>["eventing"] & {
    commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:369](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L369)

Check if config has commerce event sources.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { eventing: NonNullable<T["eventing"]> } & { eventing: EventsConfig<T>["eventing"] & { commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]> } }`
