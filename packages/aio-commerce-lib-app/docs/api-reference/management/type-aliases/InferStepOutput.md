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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:293](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L293)

Infer the output type from a leaf step.

## Type Parameters

| Type Parameter |
| -------------- |
| `TStep`        |
