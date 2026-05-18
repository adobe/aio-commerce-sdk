---
title: "isSucceededState()"
editUrl: false
prev: false
next: false
---

```ts
function isSucceededState(
  state: InstallationState,
): state is SucceededInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:133](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L133)

Type guard for succeeded installation state.

## Parameters

| Parameter | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `state`   | [`InstallationState`](../type-aliases/InstallationState.md) |

## Returns

`state is SucceededInstallationState`
