# `ConfigOptions`

```ts
type ConfigOptions = OperationOptions & {
  encryptionKey?: string;
};
```

Defined in: [types/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-config/source/types/index.ts#L23)

Options for controlling configuration operations.

## Type Declaration

### encryptionKey?

```ts
optional encryptionKey?: string;
```

Optional encryption key for encrypting/decrypting password fields.
