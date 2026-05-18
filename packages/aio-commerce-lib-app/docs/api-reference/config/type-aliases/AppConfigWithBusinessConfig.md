# `AppConfigWithBusinessConfig`

```ts
type AppConfigWithBusinessConfig = CommerceAppConfigOutputModel & {
  businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L20)

Config type when business config is present.

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
```
