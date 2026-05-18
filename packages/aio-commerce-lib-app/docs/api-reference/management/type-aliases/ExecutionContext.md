# `ExecutionContext\<TStepCtx\>`

```ts
type ExecutionContext<TStepCtx> = InstallationContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L67)

The execution context passed to leaf step run handlers.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
