# `LeafStep\<TName, TConfig, TStepCtx, TOutput\>`

```ts
type LeafStep<TName, TConfig, TStepCtx, TOutput> = StepBase<TName, TConfig> & {
  run: (
    config: TConfig,
    context: ExecutionContext<TStepCtx>,
  ) => TOutput | Promise<TOutput>;
  type: "leaf";
};
```

Defined in: [management/installation/workflow/step.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L72)

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

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | `string`                        |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | `CommerceAppConfigOutputModel`  |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TOutput`                                            | `unknown`                       |
