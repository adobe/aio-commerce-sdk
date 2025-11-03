# `CommerceValidationError`

Defined in: [utils/commerce-config-validation.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/commerce-config-validation.ts#L29)

## Extends

- `Error`

## Constructors

### Constructor

```ts
new CommerceValidationError(message: string, code: string): CommerceValidationError;
```

Defined in: [utils/commerce-config-validation.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/commerce-config-validation.ts#L30)

#### Parameters

| Parameter | Type     | Default value               |
| --------- | -------- | --------------------------- |
| `message` | `string` | `undefined`                 |
| `code`    | `string` | `"INVALID_COMMERCE_CONFIG"` |

#### Returns

`CommerceValidationError`

#### Overrides

```ts
Error.constructor;
```
