# `isSucceededState()`

```ts
function isSucceededState(
  state: InstallationState,
): state is SucceededInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:145](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L145)

Type guard for succeeded installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is SucceededInstallationState`
