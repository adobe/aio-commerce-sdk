# `isCompletedState()`

```ts
function isCompletedState(
  state: InstallationState,
): state is SucceededInstallationState | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:167](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L167)

Type guard for completed installation state (succeeded or failed).

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

state is SucceededInstallationState \| FailedInstallationState
