# `installationRuntimeAction()`

```ts
function installationRuntimeAction(
  __namedParameters: RuntimeActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [actions/installation.ts:317](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/actions/installation.ts#L317)

The route handler for the runtime action.

## Parameters

| Parameter           | Type                       |
| ------------------- | -------------------------- |
| `__namedParameters` | `RuntimeActionFactoryArgs` |

## Returns

```ts
(params: RuntimeActionParams): Promise<ActionResponse>;
```

### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `params`  | `RuntimeActionParams` |

### Returns

`Promise`\<`ActionResponse`\>
