# `ExecutionContext\<TStepCtx\>`

```ts
type ExecutionContext<TStepCtx> = InstallationContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L67)

The execution context passed to leaf step run handlers.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
