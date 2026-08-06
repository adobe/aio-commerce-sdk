# `CommerceSdkErrorOptions\<T\>`

```ts
type CommerceSdkErrorOptions<T> = CommerceSdkErrorBaseOptions & T;
```

Defined in: [error/base-error.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-core/source/error/base-error.ts#L30)

Helper type to define custom error options.

## Type Parameters

| Type Parameter                                | Default type                    |
| --------------------------------------------- | ------------------------------- |
| `T` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

## Example

```ts
type ValidationErrorOptions = CommerceSdkErrorOptions<{
  field: string;
  value: unknown;
}>;
```
