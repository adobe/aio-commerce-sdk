# `BranchStep\<TName, TConfig, TStepCtx, TChildren\>`

```ts
type BranchStep<TName, TConfig, TStepCtx, TChildren> = StepBase<
  TName,
  TConfig
> & {
  children: TChildren;
  context?: StepContextFactory<TStepCtx>;
  type: "branch";
  validate?: (
    config: TConfig,
    context: ValidationExecutionContext<TStepCtx>,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L146)

A branch step that contains children (no execution).

## Type Declaration

### children

```ts
children: TChildren;
```

The children steps of this branch.

### context?

```ts
optional context?: StepContextFactory<TStepCtx>;
```

An optional factory function to setup shared context for the children steps.

### type

```ts
type: "branch";
```

### validate?

```ts
optional validate?: (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Optional pre-installation validation handler for the branch itself.
Called before children are validated. Returning an empty array means
the branch has no issues at this level.

#### Parameters

| Parameter | Type                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `config`  | `TConfig`                                                                   |
| `context` | [`ValidationExecutionContext`](ValidationExecutionContext.md)\<`TStepCtx`\> |

#### Returns

\| [`ValidationIssue`](ValidationIssue.md)[]
\| `Promise`\<[`ValidationIssue`](ValidationIssue.md)[]\>

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | `string`                        |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | `CommerceAppConfigOutputModel`  |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TChildren` _extends_ [`AnyStep`](AnyStep.md)[]      | [`AnyStep`](AnyStep.md)[]       |
