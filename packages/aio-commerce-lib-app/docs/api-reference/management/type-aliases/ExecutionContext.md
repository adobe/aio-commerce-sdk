# `ExecutionContext\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type ExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = LifecycleContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:64](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L64)

The execution context passed to leaf step run handlers.

## Type Parameters

| Type Parameter                                                                            | Default type                    |
| ----------------------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
