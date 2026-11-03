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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:119](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L119)

A leaf step that executes work (no children).

May optionally contribute the resource-reconciliation capability; `plan` and
`apply` are meant to be provided together (plan the changes, then apply them).

## Type Parameters

| Type Parameter                                                                                        | Default type                      |
| ----------------------------------------------------------------------------------------------------- | --------------------------------- |
| <a id="type-parameter-tname"></a> `TName` _extends_ `string`                                          | `string`                          |
| <a id="type-parameter-tconfig"></a> `TConfig` _extends_ `CommerceAppConfigOutputModel`                | `CommerceAppConfigOutputModel`    |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\>             | `Record`\<`string`, `unknown`\>   |
| <a id="type-parameter-toutput"></a> `TOutput`                                                         | `unknown`                         |
| <a id="type-parameter-tplan"></a> `TPlan` _extends_ `DomainPlan`                                      | `DomainPlan`                      |
| <a id="type-parameter-tsnapshotdata"></a> `TSnapshotData` _extends_ [`WorkflowData`](WorkflowData.md) | [`WorkflowData`](WorkflowData.md) |

## Type Declaration

### ~~install~~

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

#### Deprecated

Use `plan` and `apply`. Installing is a plan with no baseline.

### type

```ts
type: "leaf";
```

### ~~uninstall?~~

```ts
uninstall?: (config: TConfig, context: ExecutionContext<TStepCtx>) => void | Promise<void>;
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

#### Deprecated

Use `plan` and `apply`. Uninstalling is a plan with no target.

### ~~validate?~~

```ts
validate?: (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
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

#### Deprecated

Use `plan`, which reports issues alongside the step's plan.
