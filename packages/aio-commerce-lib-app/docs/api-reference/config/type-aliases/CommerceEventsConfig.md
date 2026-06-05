# `CommerceEventsConfig\<T\>`

```ts
type CommerceEventsConfig<T> = EventsConfig<T> & {
  eventing: EventsConfig<T>["eventing"] & {
    commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:325](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L325)

Config type when commerce event sources are present.

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

## Type Parameters

| Type Parameter                       | Default type                   |
| ------------------------------------ | ------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |
