# `LeafStep\<TName, TConfig, TStepCtx, TOutput\>`

```ts
type LeafStep<TName, TConfig, TStepCtx, TOutput> = StepBase<TName, TConfig> & {
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
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L110)

A leaf step that executes work (no children).

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
