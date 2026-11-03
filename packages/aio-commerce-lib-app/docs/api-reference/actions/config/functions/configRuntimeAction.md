# `configRuntimeAction()`

```ts
function configRuntimeAction(
  args: ConfigActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/config/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/actions/config/index.ts#L23)

Factory to create the route handler for the `config` action.

## Parameters

| Parameter | Type                      | Description                                          |
| --------- | ------------------------- | ---------------------------------------------------- |
| `args`    | `ConfigActionFactoryArgs` | The arguments required to create the runtime action. |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
