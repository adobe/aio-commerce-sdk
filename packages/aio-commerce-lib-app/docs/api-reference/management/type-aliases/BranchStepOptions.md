# `BranchStepOptions\<TName *extends* `string`, TConfig *extends* `CommerceAppConfigOutputModel`, TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>, TChildren *extends* [`AnyStep`](AnyStep.md)[] = [`AnyStep`](AnyStep.md)[]\>`

```ts
type BranchStepOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TChildren extends AnyStep[] = AnyStep[],
> = Omit<BranchStep<TName, TConfig, TStepCtx, TChildren>, "type">;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:246](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L246)

Options for defining a branch step.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | -                               |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | -                               |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TChildren` _extends_ [`AnyStep`](AnyStep.md)[]      | [`AnyStep`](AnyStep.md)[]       |
