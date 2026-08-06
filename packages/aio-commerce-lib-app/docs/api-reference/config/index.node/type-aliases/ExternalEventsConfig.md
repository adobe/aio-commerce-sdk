# `ExternalEventsConfig\<T\>`

```ts
type ExternalEventsConfig<T> = EventsConfig<T> & {
  eventing: EventsConfig<T>["eventing"] & {
    external: NonNullable<EventsConfig<T>["eventing"]["external"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:357](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L357)

Config type when external event sources are present.

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

## Type Parameters

| Type Parameter                       | Default type                   |
| ------------------------------------ | ------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |
