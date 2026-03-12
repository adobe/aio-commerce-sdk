# `Step\<TName, TConfig, TStepCtx, TOutput\>`

```ts
type Step<TName, TConfig, TStepCtx, TOutput> =
  | LeafStep<TName, TConfig, TStepCtx, TOutput>
  | BranchStep<TName, TConfig, TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L103)

A step in the installation tree (discriminated union by `type`).

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | `string`                        |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | `CommerceAppConfigOutputModel`  |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TOutput`                                            | `unknown`                       |
