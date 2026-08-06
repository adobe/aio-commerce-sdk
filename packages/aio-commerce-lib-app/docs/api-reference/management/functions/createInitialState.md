# `createInitialState()`

```ts
function createInitialState(
  options: CreateInitialStateOptions,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:92](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L92)

Creates an initial installation state from a root step and config.

Filters steps based on their `when` conditions and builds a
tree structure with all steps set to "pending".

## Parameters

| Parameter | Type                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `options` | [`CreateInitialStateOptions`](../type-aliases/CreateInitialStateOptions.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
