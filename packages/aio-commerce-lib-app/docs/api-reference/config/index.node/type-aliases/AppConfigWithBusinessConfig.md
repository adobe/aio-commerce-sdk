# `AppConfigWithBusinessConfig\<T *extends* `AnyCommerceAppConfig`\>`

```ts
type AppConfigWithBusinessConfig<T extends AnyCommerceAppConfig> = T & {
  businessConfig: NonNullable<T["businessConfig"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L22)

Config type when business config is present.

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Type Declaration

### businessConfig

```ts
businessConfig: NonNullable<T["businessConfig"]>;
```
