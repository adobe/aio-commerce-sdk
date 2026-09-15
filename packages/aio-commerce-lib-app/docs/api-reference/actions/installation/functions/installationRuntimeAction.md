# `installationRuntimeAction()`

```ts
function installationRuntimeAction(
  args: RuntimeActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/index.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/actions/installation/index.ts#L33)

Factory to create the route handler for the `installation` action.

## Parameters

| Parameter | Type                       | Description                                          |
| --------- | -------------------------- | ---------------------------------------------------- |
| `args`    | `RuntimeActionFactoryArgs` | The arguments required to create the runtime action. |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
