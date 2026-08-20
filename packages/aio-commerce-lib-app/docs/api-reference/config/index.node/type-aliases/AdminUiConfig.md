# `AdminUiConfig\<T\>`

```ts
type AdminUiConfig<T> = T & {
  adminUi: NonNullable<T["adminUi"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:279](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L279)

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
