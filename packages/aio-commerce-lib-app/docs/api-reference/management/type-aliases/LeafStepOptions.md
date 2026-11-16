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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:237](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L237)

Options for defining a leaf step.

## Type Parameters

| Type Parameter                                                                                        | Default type                      |
| ----------------------------------------------------------------------------------------------------- | --------------------------------- |
| <a id="type-parameter-tname"></a> `TName` _extends_ `string`                                          | -                                 |
| <a id="type-parameter-tconfig"></a> `TConfig` _extends_ `CommerceAppConfigOutputModel`                | -                                 |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\>             | `Record`\<`string`, `unknown`\>   |
| <a id="type-parameter-toutput"></a> `TOutput`                                                         | `unknown`                         |
| <a id="type-parameter-tplan"></a> `TPlan` _extends_ `DomainPlan`                                      | `DomainPlan`                      |
| <a id="type-parameter-tsnapshotdata"></a> `TSnapshotData` _extends_ [`WorkflowData`](WorkflowData.md) | [`WorkflowData`](WorkflowData.md) |
