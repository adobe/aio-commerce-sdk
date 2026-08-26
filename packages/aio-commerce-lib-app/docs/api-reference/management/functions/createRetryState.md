# `createRetryState()`

```ts
function createRetryState(
  failedState: FailedInstallationState,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:111](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L111)

Creates a retry state from a failed state.
Preserves succeeded steps and their data so the workflow resumes from
the failed step rather than restarting from scratch.

## Parameters

| Parameter     | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| `failedState` | [`FailedInstallationState`](../type-aliases/FailedInstallationState.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
