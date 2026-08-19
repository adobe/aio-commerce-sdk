# `isInProgressState()`

```ts
function isInProgressState(
  state: InstallationState,
): state is InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L146)

Type guard for in-progress installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is InProgressInstallationState`
