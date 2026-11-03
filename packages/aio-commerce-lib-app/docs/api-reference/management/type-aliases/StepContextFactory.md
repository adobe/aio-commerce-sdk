# `StepContextFactory\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type StepContextFactory<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = (context: LifecycleContext) => TStepCtx | Promise<TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L59)

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
