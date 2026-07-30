# `createRetryState()`

```ts
function createRetryState(
  failedState: FailedInstallationState,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:111](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L111)

Creates a retry state from a failed state.
Preserves succeeded steps and their data so the workflow resumes from
the failed step rather than restarting from scratch.

## Parameters

| Parameter     | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| `failedState` | [`FailedInstallationState`](../type-aliases/FailedInstallationState.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
