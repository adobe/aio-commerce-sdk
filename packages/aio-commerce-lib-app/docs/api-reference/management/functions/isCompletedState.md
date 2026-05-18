# `isCompletedState()`

```ts
function isCompletedState(
  state: InstallationState,
): state is SucceededInstallationState | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:159](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L159)

Type guard for completed installation state (succeeded or failed).

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

state is SucceededInstallationState \| FailedInstallationState
