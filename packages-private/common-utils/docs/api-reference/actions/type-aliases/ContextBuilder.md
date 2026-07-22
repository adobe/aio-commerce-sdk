# `ContextBuilder\<TExisting, TNew\>`

```ts
type ContextBuilder<TExisting, TNew> = (
  ctx: TExisting,
) => Promisable<TNew | undefined>;
```

Defined in: [actions/http/types.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L55)

Context builder function type.
Receives current context and returns additional context properties (sync or async).

## Type Parameters

| Type Parameter                                        | Default type                    | Description                            |
| ----------------------------------------------------- | ------------------------------- | -------------------------------------- |
| `TExisting` _extends_ [`BaseContext`](BaseContext.md) | [`BaseContext`](BaseContext.md) | The existing context type              |
| `TNew` _extends_ `Record`\<`string`, `unknown`\>      | `Record`\<`string`, `unknown`\> | The new context properties being added |

## Parameters

| Parameter | Type        |
| --------- | ----------- |
| `ctx`     | `TExisting` |

## Returns

`Promisable`\<`TNew` \| `undefined`\>
