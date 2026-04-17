# `createInitialInstallationState()`

```ts
function createInitialInstallationState(
  options: CreateInitialInstallationStateOptions,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L61)

Creates an initial installation state from the config and step definitions.
Filters steps based on their `when` conditions and builds a tree structure
with all steps set to "pending".

## Parameters

| Parameter | Type                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| `options` | [`CreateInitialInstallationStateOptions`](../type-aliases/CreateInitialInstallationStateOptions.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
