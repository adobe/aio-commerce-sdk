# `ValidationExecutionContext\<TStepCtx\>`

```ts
type ValidationExecutionContext<TStepCtx> = ValidationContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L78)

The context passed to step `validate` handlers (base validation context merged with step-level context).

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
