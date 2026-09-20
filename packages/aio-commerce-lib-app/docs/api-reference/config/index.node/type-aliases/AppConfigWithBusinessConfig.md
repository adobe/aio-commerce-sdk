# `AppConfigWithBusinessConfig\<T *extends* `AnyCommerceAppConfig`\>`

```ts
type AppConfigWithBusinessConfig<T extends AnyCommerceAppConfig> = T & {
  businessConfig: NonNullable<T["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L22)

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
