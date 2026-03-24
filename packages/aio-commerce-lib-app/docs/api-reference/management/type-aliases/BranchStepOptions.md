# `BranchStepOptions\<TName, TConfig, TStepCtx\>`

```ts
type BranchStepOptions<TName, TConfig, TStepCtx> = Omit<
  BranchStep<TName, TConfig, TStepCtx>,
  "type"
>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:202](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L202)

Options for defining a branch step.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | -                               |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | -                               |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
