# `AdminUiConfig\<T\>`

```ts
type AdminUiConfig<T> = T & {
  adminUi: NonNullable<T["adminUi"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:279](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L279)

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
