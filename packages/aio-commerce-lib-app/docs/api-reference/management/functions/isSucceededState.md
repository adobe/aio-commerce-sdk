# `isSucceededState()`

```ts
function isSucceededState(
  state: InstallationState,
): state is SucceededInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:133](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L133)

Type guard for succeeded installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is SucceededInstallationState`
