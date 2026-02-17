# `ContextBuilder()\<TExisting, TNew\>`

```ts
type ContextBuilder<TExisting, TNew> = (
  ctx: TExisting,
) => Promisable<TNew | undefined>;
```

Defined in: [actions/http/types.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages-private/common-utils/source/actions/http/types.ts#L54)

Context builder function type.
Receives current context and returns additional context properties (sync or async).

## Type Parameters

| Type Parameter                                                      | Default type                                  | Description                            |
| ------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| `TExisting` _extends_ [`BaseContext`](../interfaces/BaseContext.md) | [`BaseContext`](../interfaces/BaseContext.md) | The existing context type              |
| `TNew` _extends_ `Record`\<`string`, `unknown`\>                    | `Record`\<`string`, `unknown`\>               | The new context properties being added |

## Parameters

| Parameter | Type        |
| --------- | ----------- |
| `ctx`     | `TExisting` |

## Returns

`Promisable`\<`TNew` \| `undefined`\>
