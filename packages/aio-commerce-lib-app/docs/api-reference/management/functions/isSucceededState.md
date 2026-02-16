# `isSucceededState()`

```ts
function isSucceededState(
  state: InstallationState,
): state is SucceededInstallationState;
```

Defined in: [management/installation/workflow/types.ts:133](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L133)

Type guard for succeeded installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is SucceededInstallationState`
