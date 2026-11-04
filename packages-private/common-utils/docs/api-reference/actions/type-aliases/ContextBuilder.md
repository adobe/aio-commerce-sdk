# `ContextBuilder\<TExisting *extends* [`BaseContext`](BaseContext.md) = [`BaseContext`](BaseContext.md), TNew *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type ContextBuilder<
  TExisting extends BaseContext = BaseContext,
  TNew extends Record<string, unknown> = Record<string, unknown>,
> = (ctx: TExisting) => Promisable<TNew | undefined>;
```

Defined in: [actions/http/types.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/actions/http/types.ts#L55)

Context builder function type.
Receives current context and returns additional context properties (sync or async).

## Type Parameters

| Type Parameter                                                                              | Default type                    | Description                            |
| ------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------- |
| <a id="type-parameter-texisting"></a> `TExisting` _extends_ [`BaseContext`](BaseContext.md) | [`BaseContext`](BaseContext.md) | The existing context type              |
| <a id="type-parameter-tnew"></a> `TNew` _extends_ `Record`\<`string`, `unknown`\>           | `Record`\<`string`, `unknown`\> | The new context properties being added |

## Parameters

| Parameter | Type        |
| --------- | ----------- |
| `ctx`     | `TExisting` |

## Returns

`Promisable`\<`TNew` \| `undefined`\>
