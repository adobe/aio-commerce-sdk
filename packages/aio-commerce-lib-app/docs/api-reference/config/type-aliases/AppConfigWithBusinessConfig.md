# `AppConfigWithBusinessConfig`

```ts
type AppConfigWithBusinessConfig = CommerceAppConfigOutputModel & {
  businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L20)

Config type when business config is present.

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
```
