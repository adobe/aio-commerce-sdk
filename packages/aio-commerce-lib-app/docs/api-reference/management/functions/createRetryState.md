# `createRetryState()`

```ts
function createRetryState(
  failedState: FailedInstallationState,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L110)

Creates a retry state from a failed state.
Preserves succeeded steps and their data so the workflow resumes from
the failed step rather than restarting from scratch.

## Parameters

| Parameter     | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| `failedState` | [`FailedInstallationState`](../type-aliases/FailedInstallationState.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
