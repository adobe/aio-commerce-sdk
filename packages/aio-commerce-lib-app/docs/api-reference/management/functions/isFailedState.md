# `isFailedState()`

```ts
function isFailedState(
  state: InstallationState,
): state is FailedInstallationState;
```

Defined in: [management/installation/workflow/types.ts:140](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L140)

Type guard for failed installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is FailedInstallationState`
