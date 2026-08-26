# `readCommerceAppConfig()`

```ts
function readCommerceAppConfig(cwd?: string): Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/config/lib/parser.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/config/lib/parser.ts#L118)

Read the commerce app config file as-is, without validating it.

Supports multiple config file formats (see [resolveCommerceAppConfig](resolveCommerceAppConfig.md) for the list).
The config file must export a default export with the configuration object.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`unknown`\>

The raw config object from the file

## Throws

If no config file is found or if the file doesn't export a default export
