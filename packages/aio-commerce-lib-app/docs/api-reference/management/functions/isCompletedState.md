# `isCompletedState()`

```ts
function isCompletedState(
  state: InstallationState,
): state is SucceededInstallationState | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:147](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L147)

Type guard for completed installation state (succeeded or failed).

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

state is SucceededInstallationState \| FailedInstallationState
