# `configRuntimeAction()`

```ts
function configRuntimeAction(
  args: ConfigActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/config/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/actions/config/index.ts#L23)

Factory to create the route handler for the `config` action.

## Parameters

| Parameter | Type                      | Description                                          |
| --------- | ------------------------- | ---------------------------------------------------- |
| `args`    | `ConfigActionFactoryArgs` | The arguments required to create the runtime action. |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
