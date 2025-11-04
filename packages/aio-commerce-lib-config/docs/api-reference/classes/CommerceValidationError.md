# `CommerceValidationError`

Defined in: [utils/commerce-config-validation.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/utils/commerce-config-validation.ts#L33)

## Extends

- `Error`

## Constructors

### Constructor

```ts
new CommerceValidationError(message: string, _code: string): CommerceValidationError;
```

Defined in: [utils/commerce-config-validation.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/utils/commerce-config-validation.ts#L34)

#### Parameters

| Parameter | Type     | Default value               |
| --------- | -------- | --------------------------- |
| `message` | `string` | `undefined`                 |
| `_code`   | `string` | `"INVALID_COMMERCE_CONFIG"` |

#### Returns

`CommerceValidationError`

#### Overrides

```ts
Error.constructor;
```
