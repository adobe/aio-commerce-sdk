# `StepContextFactory()\<TStepCtx\>`

```ts
type StepContextFactory<TStepCtx> = (
  context: InstallationContext,
) => TStepCtx | Promise<TStepCtx>;
```

Defined in: [management/installation/workflow/step.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L41)

Factory function type for creating step-specific context.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `context` | [`InstallationContext`](InstallationContext.md) |

## Returns

`TStepCtx` \| `Promise`\<`TStepCtx`\>
