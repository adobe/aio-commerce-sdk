# `BranchStepOptions\<TName, TConfig, TStepCtx\>`

```ts
type BranchStepOptions<TName, TConfig, TStepCtx> = Omit<
  BranchStep<TName, TConfig, TStepCtx>,
  "type"
>;
```

Defined in: [management/installation/workflow/step.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L146)

Options for defining a branch step.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | -                               |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | -                               |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
