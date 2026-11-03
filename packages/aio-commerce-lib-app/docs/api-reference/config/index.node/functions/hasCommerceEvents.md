# `hasCommerceEvents()`

```ts
function hasCommerceEvents<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { eventing: NonNullable<T["eventing"]> } & {
  eventing: EventsConfig<T>["eventing"] & {
    commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:369](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L369)

Check if config has commerce event sources.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { eventing: NonNullable<T["eventing"]> } & { eventing: EventsConfig<T>["eventing"] & { commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]> } }`
