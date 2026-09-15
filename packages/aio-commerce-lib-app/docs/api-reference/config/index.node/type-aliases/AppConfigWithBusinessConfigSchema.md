# `AppConfigWithBusinessConfigSchema\<T *extends* `AnyCommerceAppConfig`\>`

```ts
type AppConfigWithBusinessConfigSchema<T extends AnyCommerceAppConfig> = T & {
  businessConfig: NonNullable<T["businessConfig"]> & {
    schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L27)

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
