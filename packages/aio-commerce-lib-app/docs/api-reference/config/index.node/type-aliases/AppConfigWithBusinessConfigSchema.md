# `AppConfigWithBusinessConfigSchema\<T\>`

```ts
type AppConfigWithBusinessConfigSchema<T> = T & {
  businessConfig: NonNullable<T["businessConfig"]> & {
    schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L24)

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
