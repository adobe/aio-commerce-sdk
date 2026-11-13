# `StepContextFactory\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type StepContextFactory<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = (context: LifecycleContext) => TStepCtx | Promise<TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L59)

Factory function type for creating step-specific context.

## Type Parameters

| Type Parameter                                                                            | Default type                    |
| ----------------------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `context` | [`LifecycleContext`](LifecycleContext.md) |

## Returns

`TStepCtx` \| `Promise`\<`TStepCtx`\>
