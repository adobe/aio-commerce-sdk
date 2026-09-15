# `ValidationExecutionContext\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type ValidationExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = ValidationContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L80)

The context passed to step `validate` handlers (base validation context merged with step-level context).

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
