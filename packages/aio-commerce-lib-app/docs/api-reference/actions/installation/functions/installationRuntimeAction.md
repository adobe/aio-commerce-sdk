# `installationRuntimeAction()`

```ts
function installationRuntimeAction(
  args: RuntimeActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/index.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/actions/installation/index.ts#L33)

Factory to create the route handler for the `installation` action.

## Parameters

| Parameter | Type                       | Description                                          |
| --------- | -------------------------- | ---------------------------------------------------- |
| `args`    | `RuntimeActionFactoryArgs` | The arguments required to create the runtime action. |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
