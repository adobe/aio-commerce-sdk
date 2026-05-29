# `AppConfigWithBusinessConfig\<T\>`

```ts
type AppConfigWithBusinessConfig<T> = T & {
  businessConfig: NonNullable<T["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L22)

Config type when business config is present.

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<T["businessConfig"]>;
```

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |
