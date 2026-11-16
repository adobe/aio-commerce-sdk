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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:336](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L336)

Infer the output type from a leaf step.

## Type Parameters

| Type Parameter                            |
| ----------------------------------------- |
| <a id="type-parameter-tstep"></a> `TStep` |
