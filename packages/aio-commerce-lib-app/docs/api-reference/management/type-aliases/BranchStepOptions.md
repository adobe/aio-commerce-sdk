# `BranchStepOptions\<TName, TConfig, TStepCtx, TChildren\>`

```ts
type BranchStepOptions<TName, TConfig, TStepCtx, TChildren> = Omit<
  BranchStep<TName, TConfig, TStepCtx, TChildren>,
  "type"
>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:222](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L222)

Options for defining a branch step.

## Type Parameters

| Type Parameter                                                | Default type                            |
| ------------------------------------------------------------- | --------------------------------------- |
| `TName` _extends_ `string`                                    | -                                       |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`            | -                                       |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\>          | `Record`\<`string`, `unknown`\>         |
| `TChildren` _extends_ [`AnyStep`](../interfaces/AnyStep.md)[] | [`AnyStep`](../interfaces/AnyStep.md)[] |
