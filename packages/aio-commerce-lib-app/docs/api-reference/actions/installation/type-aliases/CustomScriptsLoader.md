# `CustomScriptsLoader`

```ts
type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: LifecycleContext["logger"],
) => Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/common.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/actions/installation/common.ts#L56)

Loads generated custom installation script modules.

## Parameters

| Parameter | Type                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`                                                           |
| `logger`  | [`LifecycleContext`](../../../management/type-aliases/LifecycleContext.md)\[`"logger"`\] |

## Returns

`Record`\<`string`, `unknown`\>
