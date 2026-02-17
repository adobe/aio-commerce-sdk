# `isInProgressState()`

```ts
function isInProgressState(
  state: InstallationState,
): state is InProgressInstallationState;
```

Defined in: [management/installation/workflow/types.ts:126](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L126)

Type guard for in-progress installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is InProgressInstallationState`
