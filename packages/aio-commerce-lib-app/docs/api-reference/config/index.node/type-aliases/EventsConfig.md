# `EventsConfig\<T *extends* `AnyCommerceAppConfig`=`CommerceAppConfigOutputModel`\>`

```ts
type EventsConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & {
  eventing: NonNullable<T["eventing"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:341](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L341)

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
