# `createInitialInstallationState()`

```ts
function createInitialInstallationState(
  options: CreateInitialInstallationStateOptions,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L63)

Creates an initial installation state from the config and step definitions.
Filters steps based on their `when` conditions and builds a tree structure
with all steps set to "pending".

## Parameters

| Parameter | Type                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| `options` | [`CreateInitialInstallationStateOptions`](../type-aliases/CreateInitialInstallationStateOptions.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
