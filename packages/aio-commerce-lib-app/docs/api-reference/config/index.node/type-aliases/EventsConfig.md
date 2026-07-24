# `EventsConfig\<T\>`

```ts
type EventsConfig<T> = T & {
  eventing: NonNullable<T["eventing"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:341](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L341)

Config type when eventing is present.

## Type Declaration

### eventing

```ts
eventing: NonNullable<T["eventing"]>;
```

## Type Parameters

| Type Parameter                       | Default type                   |
| ------------------------------------ | ------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |
