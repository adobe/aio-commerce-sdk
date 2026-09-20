# `runInstallation()`

```ts
function runInstallation(
  options: RunInstallationOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:119](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L119)

Runs the full installation workflow. Returns the final state (never throws).

Retries once on failure. `onInstallationFailure` only fires if both attempts
fail; `isRetry: true` is set on the result when the retry succeeds.

## Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `options` | [`RunInstallationOptions`](../type-aliases/RunInstallationOptions.md) |

## Returns

`Promise`\<
\| [`SucceededWorkflowState`](../type-aliases/SucceededWorkflowState.md)
\| [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md)\>
