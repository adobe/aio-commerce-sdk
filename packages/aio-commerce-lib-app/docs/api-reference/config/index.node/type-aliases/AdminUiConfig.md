# `AdminUiConfig\<T\>`

```ts
type AdminUiConfig<T> = T & {
  adminUi: NonNullable<T["adminUi"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:290](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L290)

Config type when `adminUi` configuration is present.

## Type Declaration

### adminUi

```ts
adminUi: NonNullable<T["adminUi"]>;
```

## Type Parameters

| Type Parameter                       | Default type                   |
| ------------------------------------ | ------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |
