# `CommerceSdkErrorOptions\<T *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type CommerceSdkErrorOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> = CommerceSdkErrorBaseOptions & T;
```

Defined in: [error/base-error.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-core/source/error/base-error.ts#L30)

Helper type to define custom error options.

## Type Parameters

| Type Parameter                                                              | Default type                    |
| --------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-t"></a> `T` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

## Example

```ts
type ValidationErrorOptions = CommerceSdkErrorOptions<{
  field: string;
  value: unknown;
}>;
```
