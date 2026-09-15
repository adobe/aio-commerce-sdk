# `ExecutionContext\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type ExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = LifecycleContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L69)

The execution context passed to leaf step run handlers.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
