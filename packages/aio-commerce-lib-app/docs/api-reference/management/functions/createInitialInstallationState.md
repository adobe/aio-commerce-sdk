# `createInitialInstallationState()`

```ts
function createInitialInstallationState(
  options: CreateInitialInstallationStateOptions,
): InProgressInstallationState;
```

Defined in: [management/installation/runner.ts:51](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L51)

Creates an initial installation state from the config and step definitions.
Filters steps based on their `when` conditions and builds a tree structure
with all steps set to "pending".

## Parameters

| Parameter | Type                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| `options` | [`CreateInitialInstallationStateOptions`](../type-aliases/CreateInitialInstallationStateOptions.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
