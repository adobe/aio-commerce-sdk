# `InferStepOutput\<TStep\>`

```ts
type InferStepOutput<TStep> =
  TStep extends LeafStep<
    infer _TName,
    infer _TConfig,
    infer _TStepCtx,
    infer TOutput
  >
    ? Awaited<TOutput>
    : never;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:336](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L336)

Infer the output type from a leaf step.

## Type Parameters

| Type Parameter                            |
| ----------------------------------------- |
| <a id="type-parameter-tstep"></a> `TStep` |
