---
title: "installationRuntimeAction()"
editUrl: false
prev: false
next: false
---

```ts
function installationRuntimeAction(
  __namedParameters: RuntimeActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation.ts:600](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/actions/installation.ts#L600)

Factory to create the route handler for the `installation` action.

## Parameters

| Parameter           | Type                       |
| ------------------- | -------------------------- |
| `__namedParameters` | `RuntimeActionFactoryArgs` |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
