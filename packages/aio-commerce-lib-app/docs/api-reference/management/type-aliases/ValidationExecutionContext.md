# `ValidationExecutionContext\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type ValidationExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = ValidationContext & TStepCtx;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L75)

The context passed to step `validate` handlers (base validation context merged with step-level context).

## Type Parameters

| Type Parameter                                                                            | Default type                    |
| ----------------------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
