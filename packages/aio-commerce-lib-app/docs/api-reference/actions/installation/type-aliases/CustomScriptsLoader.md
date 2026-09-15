# `CustomScriptsLoader`

```ts
type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: LifecycleContext["logger"],
) => Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/common.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/actions/installation/common.ts#L74)

Loads generated custom installation script modules.

## Parameters

| Parameter | Type                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`                                                           |
| `logger`  | [`LifecycleContext`](../../../management/type-aliases/LifecycleContext.md)\[`"logger"`\] |

## Returns

`Record`\<`string`, `unknown`\>
