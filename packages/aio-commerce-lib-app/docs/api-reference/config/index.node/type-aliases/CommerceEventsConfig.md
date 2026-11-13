# `CommerceEventsConfig\<T *extends* `AnyCommerceAppConfig`=`CommerceAppConfigOutputModel`\>`

```ts
type CommerceEventsConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = EventsConfig<T> & {
  eventing: EventsConfig<T>["eventing"] & {
    commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:348](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L348)

Config type when commerce event sources are present.

## Type Parameters

| Type Parameter                                                     | Default type                   |
| ------------------------------------------------------------------ | ------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |

## Type Declaration

### eventing

```ts
eventing: EventsConfig<T>["eventing"] & {
  commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
};
```

#### Type Declaration

##### commerce

```ts
commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
```
