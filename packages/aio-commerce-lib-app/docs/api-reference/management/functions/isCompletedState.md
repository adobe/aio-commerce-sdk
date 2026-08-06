# `isCompletedState()`

```ts
function isCompletedState(
  state: InstallationState,
): state is SucceededInstallationState | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:167](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L167)

Type guard for completed installation state (succeeded or failed).

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

state is SucceededInstallationState \| FailedInstallationState
