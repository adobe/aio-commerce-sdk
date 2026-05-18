---
title: "LeafStepOptions\\<TName, TConfig, TStepCtx, TOutput\\>"
editUrl: false
prev: false
next: false
---

```ts
type LeafStepOptions<TName, TConfig, TStepCtx, TOutput> = Omit<
  LeafStep<TName, TConfig, TStepCtx, TOutput>,
  "type"
>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:214](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L214)

Options for defining a leaf step.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | -                               |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | -                               |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TOutput`                                            | `unknown`                       |
