# `LibConfigOptions`

```ts
type LibConfigOptions = {
  cacheTimeout?: number;
  encryptionKey?: string | null;
};
```

Defined in: [aio-commerce-lib-config/source/types/index.ts:17](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/index.ts#L17)

Options for controlling fetch behavior, particularly cache timeout.

## Properties

### cacheTimeout?

```ts
optional cacheTimeout: number;
```

Defined in: [aio-commerce-lib-config/source/types/index.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/index.ts#L19)

Optional cache timeout in milliseconds.

---

### encryptionKey?

```ts
optional encryptionKey: string | null;
```

Defined in: [aio-commerce-lib-config/source/types/index.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/index.ts#L21)

Optional encryption key for encrypting/decrypting password fields. If not provided, falls back to AIO_COMMERCE_CONFIG_ENCRYPTION_KEY environment variable.
