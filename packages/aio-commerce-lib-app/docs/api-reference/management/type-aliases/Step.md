# `Step\<TName, TConfig, TStepCtx, TOutput\>`

```ts
type Step<TName, TConfig, TStepCtx, TOutput> =
  | LeafStep<TName, TConfig, TStepCtx, TOutput>
  | BranchStep<TName, TConfig, TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:172](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L172)

A step in the installation tree (discriminated union by `type`).

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | `string`                        |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | `CommerceAppConfigOutputModel`  |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TOutput`                                            | `unknown`                       |
