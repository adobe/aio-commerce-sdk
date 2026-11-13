# `BranchStep\<TName *extends* `string`=`string`, TConfig *extends* `CommerceAppConfigOutputModel`=`CommerceAppConfigOutputModel`, TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>, TChildren *extends* [`AnyStep`](AnyStep.md)[] = [`AnyStep`](AnyStep.md)[]\>`

```ts
type BranchStep<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TChildren extends AnyStep[] = AnyStep[],
> = StepBase<TName, TConfig> & {
  children: TChildren;
  context?: StepContextFactory<TStepCtx>;
  type: "branch";
  validate?: (
    config: TConfig,
    context: ValidationExecutionContext<TStepCtx>,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:164](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L164)

A branch step that contains children (no execution).

## Type Parameters

| Type Parameter                                                                            | Default type                    |
| ----------------------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-tname"></a> `TName` _extends_ `string`                              | `string`                        |
| <a id="type-parameter-tconfig"></a> `TConfig` _extends_ `CommerceAppConfigOutputModel`    | `CommerceAppConfigOutputModel`  |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| <a id="type-parameter-tchildren"></a> `TChildren` _extends_ [`AnyStep`](AnyStep.md)[]     | [`AnyStep`](AnyStep.md)[]       |

## Type Declaration

### children

```ts
children: TChildren;
```

The children steps of this branch.

### context?

```ts
context?: StepContextFactory<TStepCtx>;
```

An optional factory function to setup shared context for the children steps.

### type

```ts
type: "branch";
```

### ~~validate?~~

```ts
validate?: (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Optional pre-execution validation handler for the branch itself.
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

#### Deprecated

Use `plan` on the branch's leaf steps, which reports issues alongside their plans.
