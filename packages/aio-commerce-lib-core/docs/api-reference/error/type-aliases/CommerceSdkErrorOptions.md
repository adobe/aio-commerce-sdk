# `CommerceSdkErrorOptions\<T\>`

```ts
type CommerceSdkErrorOptions<T> = CommerceSdkErrorBaseOptions & T;
```

Defined in: [error/base-error.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-core/source/error/base-error.ts#L30)

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
