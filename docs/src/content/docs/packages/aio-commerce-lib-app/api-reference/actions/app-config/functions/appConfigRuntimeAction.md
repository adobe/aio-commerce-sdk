---
title: "appConfigRuntimeAction()"
editUrl: false
prev: false
next: false
---

```ts
function appConfigRuntimeAction(
  __namedParameters: RuntimeActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/app-config.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/actions/app-config.ts#L60)

Factory to create the route handler for the `app-config` action.

## Parameters

| Parameter           | Type                       |
| ------------------- | -------------------------- |
| `__namedParameters` | `RuntimeActionFactoryArgs` |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
