# `LeafStepOptions\<TName *extends* `string`, TConfig *extends* `CommerceAppConfigOutputModel`, TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>, TOutput = `unknown`, TPlan *extends* `DomainPlan`=`DomainPlan`, TSnapshotData *extends* [`WorkflowData`](WorkflowData.md) = [`WorkflowData`](WorkflowData.md)\>`

```ts
type LeafStepOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
  TPlan extends DomainPlan = DomainPlan,
  TSnapshotData extends WorkflowData = WorkflowData,
> = Omit<
  LeafStep<TName, TConfig, TStepCtx, TOutput, TPlan, TSnapshotData>,
  "type"
>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:233](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L233)

Options for defining a leaf step.

## Type Parameters

| Type Parameter                                              | Default type                      |
| ----------------------------------------------------------- | --------------------------------- |
| `TName` _extends_ `string`                                  | -                                 |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`          | -                                 |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\>        | `Record`\<`string`, `unknown`\>   |
| `TOutput`                                                   | `unknown`                         |
| `TPlan` _extends_ `DomainPlan`                              | `DomainPlan`                      |
| `TSnapshotData` _extends_ [`WorkflowData`](WorkflowData.md) | [`WorkflowData`](WorkflowData.md) |
