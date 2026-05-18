---
title: "ConfigOptions"
editUrl: false
prev: false
next: false
---

```ts
type ConfigOptions = OperationOptions & {
  encryptionKey?: string;
};
```

Defined in: [types/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-config/source/types/index.ts#L23)

Options for controlling configuration operations.

## Type Declaration

### encryptionKey?

```ts
optional encryptionKey?: string;
```

Optional encryption key for encrypting/decrypting password fields.
