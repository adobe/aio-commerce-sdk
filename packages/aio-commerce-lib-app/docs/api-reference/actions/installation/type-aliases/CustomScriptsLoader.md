# `CustomScriptsLoader`

```ts
type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: InstallationContext["logger"],
) => Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/actions/installation/router.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/actions/installation/router.ts#L63)

Loads generated custom installation script modules.

## Parameters

| Parameter | Type                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`                                                                 |
| `logger`  | [`InstallationContext`](../../../management/type-aliases/InstallationContext.md)\[`"logger"`\] |

## Returns

`Record`\<`string`, `unknown`\>
