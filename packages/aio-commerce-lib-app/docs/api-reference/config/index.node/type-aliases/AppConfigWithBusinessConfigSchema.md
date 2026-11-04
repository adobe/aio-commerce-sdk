# `AppConfigWithBusinessConfigSchema\<T *extends* `AnyCommerceAppConfig`\>`

```ts
type AppConfigWithBusinessConfigSchema<T extends AnyCommerceAppConfig> = T & {
  businessConfig: NonNullable<T["businessConfig"]> & {
    schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L27)

Config type when business config schema is present.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

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
