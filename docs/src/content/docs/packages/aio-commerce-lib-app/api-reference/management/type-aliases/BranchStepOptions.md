---
title: "BranchStepOptions\\<TName, TConfig, TStepCtx, TChildren\\>"
editUrl: false
prev: false
next: false
---

```ts
type BranchStepOptions<TName, TConfig, TStepCtx, TChildren> = Omit<
  BranchStep<TName, TConfig, TStepCtx, TChildren>,
  "type"
>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:222](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L222)

Options for defining a branch step.

## Type Parameters

| Type Parameter                                                | Default type                            |
| ------------------------------------------------------------- | --------------------------------------- |
| `TName` _extends_ `string`                                    | -                                       |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`            | -                                       |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\>          | `Record`\<`string`, `unknown`\>         |
| `TChildren` _extends_ [`AnyStep`](../interfaces/AnyStep.md)[] | [`AnyStep`](../interfaces/AnyStep.md)[] |
