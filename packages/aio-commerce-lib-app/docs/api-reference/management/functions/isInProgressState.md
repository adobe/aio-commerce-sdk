# `isInProgressState()`

```ts
function isInProgressState(
  state: InstallationState,
): state is InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:126](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L126)

Type guard for in-progress installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is InProgressInstallationState`
