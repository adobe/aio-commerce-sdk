# `ConfigOptions`

```ts
type ConfigOptions = OperationOptions & {
  encryptionKey?: string;
};
```

Defined in: [types/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-config/source/types/index.ts#L23)

Options for controlling configuration operations.

## Type Declaration

### encryptionKey?

```ts
optional encryptionKey?: string;
```

Optional encryption key for encrypting/decrypting password fields.
