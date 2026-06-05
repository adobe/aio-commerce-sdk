# `validateEncryptionKey()`

```ts
function validateEncryptionKey(key: string): void;
```

Defined in: [utils/encryption.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/utils/encryption.ts#L38)

Validates the encryption key.

## Parameters

| Parameter | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| `key`     | `string` | The encryption key to validate. |

## Returns

`void`

## Throws

If the encryption key is not a valid hex string or is not the correct length.
