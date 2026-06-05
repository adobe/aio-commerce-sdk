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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:293](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L293)

Infer the output type from a leaf step.

## Type Parameters

| Type Parameter |
| -------------- |
| `TStep`        |
