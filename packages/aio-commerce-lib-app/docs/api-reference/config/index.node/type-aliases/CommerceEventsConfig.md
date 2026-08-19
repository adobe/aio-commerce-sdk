# `CommerceEventsConfig\<T\>`

```ts
type CommerceEventsConfig<T> = EventsConfig<T> & {
  eventing: EventsConfig<T>["eventing"] & {
    commerce: NonNullable<EventsConfig<T>["eventing"]["commerce"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:348](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L348)

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
