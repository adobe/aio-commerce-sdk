# `AppConfigWithBusinessConfig\<T\>`

```ts
type AppConfigWithBusinessConfig<T> = T & {
  businessConfig: NonNullable<T["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L19)

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
