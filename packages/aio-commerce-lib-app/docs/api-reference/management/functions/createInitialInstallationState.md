# `createInitialInstallationState()`

```ts
function createInitialInstallationState(
  options: CreateInitialInstallationStateOptions,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L63)

Creates an initial installation state from the config and step definitions.
Filters steps based on their `when` conditions and builds a tree structure
with all steps set to "pending".

## Parameters

| Parameter | Type                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| `options` | [`CreateInitialInstallationStateOptions`](../type-aliases/CreateInitialInstallationStateOptions.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
