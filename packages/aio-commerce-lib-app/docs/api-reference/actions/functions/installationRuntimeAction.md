# `installationRuntimeAction()`

```ts
function installationRuntimeAction(
  __namedParameters: RuntimeActionFactoryArgs,
): (params: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [actions/installation.ts:317](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/actions/installation.ts#L317)

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
