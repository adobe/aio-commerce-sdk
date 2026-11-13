# `AdminUiConfig\<T *extends* `AnyCommerceAppConfig`=`CommerceAppConfigOutputModel`\>`

```ts
type AdminUiConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & {
  adminUi: NonNullable<T["adminUi"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:546](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L546)

Config type when `adminUi` configuration is present.

## Type Parameters

| Type Parameter                                                     | Default type                   |
| ------------------------------------------------------------------ | ------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |

## Type Declaration

### adminUi

```ts
adminUi: NonNullable<T["adminUi"]>;
```
