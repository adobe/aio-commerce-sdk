# `CustomScriptsLoader`

```ts
type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: LifecycleContext["logger"],
) => Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/common.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/actions/installation/common.ts#L54)

Loads generated custom installation script modules.

## Parameters

| Parameter | Type                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`                                                           |
| `logger`  | [`LifecycleContext`](../../../management/type-aliases/LifecycleContext.md)\[`"logger"`\] |

## Returns

`Record`\<`string`, `unknown`\>
