# `StepContextFactory\<TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type StepContextFactory<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = (context: LifecycleContext) => TStepCtx | Promise<TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:64](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L64)

Factory function type for creating step-specific context.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `context` | [`LifecycleContext`](LifecycleContext.md) |

## Returns

`TStepCtx` \| `Promise`\<`TStepCtx`\>
