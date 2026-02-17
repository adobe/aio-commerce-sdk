# `AppConfigWithBusinessConfig`

```ts
type AppConfigWithBusinessConfig = CommerceAppConfigOutputModel & {
  businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
};
```

Defined in: [config/schema/business-configuration.ts:218](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L218)

Config type when business config is present.

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
```
