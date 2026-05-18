---
title: "configRuntimeAction()"
editUrl: false
prev: false
next: false
---

```ts
function configRuntimeAction(
  __namedParameters: ConfigActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/config.ts:209](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/actions/config.ts#L209)

Factory to create the route handler for the `config` action.

## Parameters

| Parameter           | Type                      |
| ------------------- | ------------------------- |
| `__namedParameters` | `ConfigActionFactoryArgs` |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
