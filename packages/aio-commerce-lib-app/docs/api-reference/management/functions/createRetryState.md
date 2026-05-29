# `createRetryState()`

```ts
function createRetryState(
  failedState: FailedInstallationState,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L110)

Creates a retry state from a failed state.
Preserves succeeded steps and their data so the workflow resumes from
the failed step rather than restarting from scratch.

## Parameters

| Parameter     | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| `failedState` | [`FailedInstallationState`](../type-aliases/FailedInstallationState.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
