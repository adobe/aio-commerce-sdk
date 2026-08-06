# `appConfigRuntimeAction()`

```ts
function appConfigRuntimeAction(
  args: RuntimeActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [aio-commerce-lib-app/source/actions/app-config/index.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/actions/app-config/index.ts#L23)

Factory to create the route handler for the `app-config` action.

## Parameters

| Parameter | Type                       | Description                                          |
| --------- | -------------------------- | ---------------------------------------------------- |
| `args`    | `RuntimeActionFactoryArgs` | The arguments required to create the runtime action. |

## Returns

(`params`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>
