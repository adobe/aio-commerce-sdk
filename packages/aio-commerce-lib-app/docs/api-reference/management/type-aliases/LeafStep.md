# `LeafStep\<TName *extends* `string`=`string`, TConfig *extends* `CommerceAppConfigOutputModel`=`CommerceAppConfigOutputModel`, TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>, TOutput = `unknown`, TPlan *extends* `DomainPlan`=`DomainPlan`, TSnapshotData *extends* [`WorkflowData`](WorkflowData.md) = [`WorkflowData`](WorkflowData.md)\>`

```ts
type LeafStep<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
  TPlan extends DomainPlan = DomainPlan,
  TSnapshotData extends WorkflowData = WorkflowData,
> = StepBase<TName, TConfig> & {
  install: (
    config: TConfig,
    context: ExecutionContext<TStepCtx>,
  ) => TOutput | Promise<TOutput>;
  type: "leaf";
  uninstall?: (
    config: TConfig,
    context: ExecutionContext<TStepCtx>,
  ) => void | Promise<void>;
  validate?: (
    config: TConfig,
    context: ValidationExecutionContext<TStepCtx>,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
} & Partial<ResourceCapability<TConfig, TStepCtx, TPlan, TSnapshotData>>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L124)

A leaf step that executes work (no children).

May optionally contribute the resource-reconciliation capability; `plan` and
`apply` are meant to be provided together (plan the changes, then apply them).

## Type Declaration

### install

```ts
install: (config: TConfig, context: ExecutionContext<TStepCtx>) =>
  TOutput | Promise<TOutput>;
```

The execution handler for the step.

#### Parameters

| Parameter | Type                                                    |
| --------- | ------------------------------------------------------- |
| `config`  | `TConfig`                                               |
| `context` | [`ExecutionContext`](ExecutionContext.md)\<`TStepCtx`\> |

#### Returns

`TOutput` \| `Promise`\<`TOutput`\>

### type

```ts
type: "leaf";
```

### uninstall?

```ts
optional uninstall?: (config: TConfig, context: ExecutionContext<TStepCtx>) => void | Promise<void>;
```

Optional uninstall handler for the step.
Called during uninstallation to reverse the work done by `install`.
If absent, the step is silently skipped during uninstallation.

#### Parameters

| Parameter | Type                                                    |
| --------- | ------------------------------------------------------- |
| `config`  | `TConfig`                                               |
| `context` | [`ExecutionContext`](ExecutionContext.md)\<`TStepCtx`\> |

#### Returns

`void` \| `Promise`\<`void`\>

### validate?

```ts
optional validate?: (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Optional pre-execution validation handler.
Called before the workflow begins to surface issues (errors or warnings).
Returning an empty array means the step has no issues.

#### Parameters

| Parameter | Type                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `config`  | `TConfig`                                                                   |
| `context` | [`ValidationExecutionContext`](ValidationExecutionContext.md)\<`TStepCtx`\> |

#### Returns

\| [`ValidationIssue`](ValidationIssue.md)[]
\| `Promise`\<[`ValidationIssue`](ValidationIssue.md)[]\>

## Type Parameters

| Type Parameter                                              | Default type                      |
| ----------------------------------------------------------- | --------------------------------- |
| `TName` _extends_ `string`                                  | `string`                          |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`          | `CommerceAppConfigOutputModel`    |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\>        | `Record`\<`string`, `unknown`\>   |
| `TOutput`                                                   | `unknown`                         |
| `TPlan` _extends_ `DomainPlan`                              | `DomainPlan`                      |
| `TSnapshotData` _extends_ [`WorkflowData`](WorkflowData.md) | [`WorkflowData`](WorkflowData.md) |
