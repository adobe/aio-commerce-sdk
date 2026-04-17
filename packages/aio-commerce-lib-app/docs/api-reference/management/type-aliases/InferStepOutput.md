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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:293](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L293)

Infer the output type from a leaf step.

## Type Parameters

| Type Parameter |
| -------------- |
| `TStep`        |
