# `CustomScriptsLoader`

```ts
type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: InstallationContext["logger"],
) => Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/router.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/actions/installation/router.ts#L60)

Loads generated custom installation script modules.

## Parameters

| Parameter | Type                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`                                                                 |
| `logger`  | [`InstallationContext`](../../../management/type-aliases/InstallationContext.md)\[`"logger"`\] |

## Returns

`Record`\<`string`, `unknown`\>
