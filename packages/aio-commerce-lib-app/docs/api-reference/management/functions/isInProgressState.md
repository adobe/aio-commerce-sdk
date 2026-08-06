# `isInProgressState()`

```ts
function isInProgressState(
  state: InstallationState,
): state is InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L146)

Type guard for in-progress installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is InProgressInstallationState`
