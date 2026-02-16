# `allNonEmpty()`

```ts
function allNonEmpty<T>(
  params: Record<string, unknown>,
  required: T,
): params is Record<string, unknown> & Record<T[number], unknown>;
```

Defined in: [params/helpers.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/params/helpers.ts#L34)

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
