# `allNonEmpty()`

```ts
function allNonEmpty<T extends string[]>(
  params: Record<string, unknown>,
  required: T,
): params is Record<string, unknown> & Record<T[number], unknown>;
```

Defined in: [params/helpers.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-core/source/params/helpers.ts#L34)

Checks if all required parameters are non-empty.

## Type Parameters

| Type Parameter                                         |
| ------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `string`[] |

## Parameters

| Parameter  | Type                            | Description                           |
| ---------- | ------------------------------- | ------------------------------------- |
| `params`   | `Record`\<`string`, `unknown`\> | The action input parameters.          |
| `required` | `T`                             | The list of required parameter names. |

## Returns

`params is Record<string, unknown> & Record<T[number], unknown>`
