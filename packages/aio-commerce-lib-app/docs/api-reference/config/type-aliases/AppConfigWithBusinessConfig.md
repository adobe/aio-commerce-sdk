# `AppConfigWithBusinessConfig`

```ts
type AppConfigWithBusinessConfig = CommerceAppConfigOutputModel & {
  businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L20)

Config type when business config is present.

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
```
