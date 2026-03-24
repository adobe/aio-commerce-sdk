# `AppConfigWithBusinessConfig`

```ts
type AppConfigWithBusinessConfig = CommerceAppConfigOutputModel & {
  businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L20)

Config type when business config is present.

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<CommerceAppConfigOutputModel["businessConfig"]>;
```
