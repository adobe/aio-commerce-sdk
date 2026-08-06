# `CustomScriptsLoader`

```ts
type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: InstallationContext["logger"],
) => Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/router.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/actions/installation/router.ts#L60)

Loads generated custom installation script modules.

## Parameters

| Parameter | Type                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`                                                                 |
| `logger`  | [`InstallationContext`](../../../management/type-aliases/InstallationContext.md)\[`"logger"`\] |

## Returns

`Record`\<`string`, `unknown`\>
