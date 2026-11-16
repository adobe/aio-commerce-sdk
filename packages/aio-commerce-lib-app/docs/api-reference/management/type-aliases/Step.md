# `Step\<TName *extends* `string`=`string`, TConfig *extends* `CommerceAppConfigOutputModel`=`CommerceAppConfigOutputModel`, TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>, TOutput = `unknown`\>`

```ts
type Step<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> =
  | LeafStep<TName, TConfig, TStepCtx, TOutput>
  | BranchStep<TName, TConfig, TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:192](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L192)

A step in the workflow tree (discriminated union by `type`).

## Type Parameters

| Type Parameter                                                                            | Default type                    |
| ----------------------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-tname"></a> `TName` _extends_ `string`                              | `string`                        |
| <a id="type-parameter-tconfig"></a> `TConfig` _extends_ `CommerceAppConfigOutputModel`    | `CommerceAppConfigOutputModel`  |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| <a id="type-parameter-toutput"></a> `TOutput`                                             | `unknown`                       |
