# `LeafStep\<TName, TConfig, TStepCtx, TOutput\>`

```ts
type LeafStep<TName, TConfig, TStepCtx, TOutput> = StepBase<TName, TConfig> & {
  run: (
    config: TConfig,
    context: ExecutionContext<TStepCtx>,
  ) => TOutput | Promise<TOutput>;
  type: "leaf";
  validate?: (
    config: TConfig,
    context: ValidationExecutionContext<TStepCtx>,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L104)

A leaf step that executes work (no children).

## Type Declaration

### run()

```ts
run: (config: TConfig, context: ExecutionContext<TStepCtx>) =>
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

### validate()?

```ts
optional validate: (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Optional pre-installation validation handler.
Called before installation begins to surface issues (errors or warnings).
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

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | `string`                        |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | `CommerceAppConfigOutputModel`  |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TOutput`                                            | `unknown`                       |
