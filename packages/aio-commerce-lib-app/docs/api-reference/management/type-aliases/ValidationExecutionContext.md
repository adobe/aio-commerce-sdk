# `ValidationExecutionContext\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type ValidationExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = ValidationContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L75)

The context passed to step `validate` handlers (base validation context merged with step-level context).

## Type Parameters

| Type Parameter                                                                            | Default type                    |
| ----------------------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
