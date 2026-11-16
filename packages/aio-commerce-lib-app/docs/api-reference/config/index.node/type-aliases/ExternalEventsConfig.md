# `ExternalEventsConfig\<T *extends* `AnyCommerceAppConfig`=`CommerceAppConfigOutputModel`\>`

```ts
type ExternalEventsConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = EventsConfig<T> & {
  eventing: EventsConfig<T>["eventing"] & {
    external: NonNullable<EventsConfig<T>["eventing"]["external"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:357](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L357)

Config type when external event sources are present.

## Type Parameters

| Type Parameter                                                     | Default type                   |
| ------------------------------------------------------------------ | ------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |

## Type Declaration

### eventing

```ts
eventing: EventsConfig<T>["eventing"] & {
  external: NonNullable<EventsConfig<T>["eventing"]["external"]>;
};
```

#### Type Declaration

##### external

```ts
external: NonNullable<EventsConfig<T>["eventing"]["external"]>;
```
