# `ConfigOptions`

```ts
type ConfigOptions = OperationOptions & {
  encryptionKey?: string;
};
```

Defined in: [types/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/types/index.ts#L23)

Options for controlling configuration operations.

## Type Declaration

### encryptionKey?

```ts
optional encryptionKey?: string;
```

Optional encryption key for encrypting/decrypting password fields.
