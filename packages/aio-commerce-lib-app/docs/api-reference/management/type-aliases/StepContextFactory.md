# `StepContextFactory()\<TStepCtx\>`

```ts
type StepContextFactory<TStepCtx> = (
  context: InstallationContext,
) => TStepCtx | Promise<TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L41)

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
