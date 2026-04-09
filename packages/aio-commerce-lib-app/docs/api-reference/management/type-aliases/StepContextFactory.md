# `StepContextFactory()\<TStepCtx\>`

```ts
type StepContextFactory<TStepCtx> = (
  context: InstallationContext,
) => TStepCtx | Promise<TStepCtx>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L62)

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
