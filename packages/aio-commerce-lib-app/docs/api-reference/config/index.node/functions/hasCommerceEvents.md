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

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:369](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L369)

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
