# `ConfigOptions`

```ts
type ConfigOptions = OperationOptions & {
  encryptionKey?: string;
};
```

Defined in: [types/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-config/source/types/index.ts#L23)

Options for controlling configuration operations.

## Type Declaration

### encryptionKey?

```ts
optional encryptionKey?: string;
```

Optional encryption key for encrypting/decrypting password fields.
