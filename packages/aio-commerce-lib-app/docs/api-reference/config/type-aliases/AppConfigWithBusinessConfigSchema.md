# `AppConfigWithBusinessConfigSchema\<T\>`

```ts
type AppConfigWithBusinessConfigSchema<T> = T & {
  businessConfig: NonNullable<T["businessConfig"]> & {
    schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L27)

Config type when business config schema is present.

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<T["businessConfig"]> & {
  schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
};
```

#### Type Declaration

##### schema

```ts
schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
```

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |
