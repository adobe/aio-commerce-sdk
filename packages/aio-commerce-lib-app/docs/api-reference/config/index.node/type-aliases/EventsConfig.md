# `EventsConfig\<T\>`

```ts
type EventsConfig<T> = T & {
  eventing: NonNullable<T["eventing"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:341](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L341)

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
