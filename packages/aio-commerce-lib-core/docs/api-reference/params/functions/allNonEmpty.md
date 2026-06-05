# `allNonEmpty()`

```ts
function allNonEmpty<T>(
  params: Record<string, unknown>,
  required: T,
): params is Record<string, unknown> & Record<T[number], unknown>;
```

Defined in: [params/helpers.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-core/source/params/helpers.ts#L34)

Checks if all required parameters are non-empty.

## Type Parameters

| Type Parameter           |
| ------------------------ |
| `T` _extends_ `string`[] |

## Parameters

| Parameter  | Type                            | Description                           |
| ---------- | ------------------------------- | ------------------------------------- |
| `params`   | `Record`\<`string`, `unknown`\> | The action input parameters.          |
| `required` | `T`                             | The list of required parameter names. |

## Returns

`params is Record<string, unknown> & Record<T[number], unknown>`
