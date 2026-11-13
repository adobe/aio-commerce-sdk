# `EventsConfig\<T *extends* `AnyCommerceAppConfig`=`CommerceAppConfigOutputModel`\>`

```ts
type EventsConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & {
  eventing: NonNullable<T["eventing"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:341](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L341)

Config type when eventing is present.

## Type Parameters

| Type Parameter                                                     | Default type                   |
| ------------------------------------------------------------------ | ------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |

## Type Declaration

### eventing

```ts
eventing: NonNullable<T["eventing"]>;
```
