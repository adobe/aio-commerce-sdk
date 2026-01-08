# `buildObjectKeyTransformerResponseHook()`

```ts
function buildObjectKeyTransformerResponseHook(
  transformer: (key: string) => string,
  recursive: boolean,
): AfterResponseHook;
```

Defined in: [packages/aio-commerce-lib-api/source/utils/transformations/hooks.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-api/source/utils/transformations/hooks.ts#L22)

Builds a hook that transforms the keys of an object using the provided transformer function.

## Parameters

| Parameter     | Type                          | Default value | Description                                              |
| ------------- | ----------------------------- | ------------- | -------------------------------------------------------- |
| `transformer` | (`key`: `string`) => `string` | `undefined`   | The function to transform the keys of the object.        |
| `recursive`   | `boolean`                     | `true`        | Whether to transform the keys of the object recursively. |

## Returns

`AfterResponseHook`
