# `isFailedState()`

```ts
function isFailedState(
  state: InstallationState,
): state is FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:160](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L160)

Type guard for failed installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is FailedInstallationState`
