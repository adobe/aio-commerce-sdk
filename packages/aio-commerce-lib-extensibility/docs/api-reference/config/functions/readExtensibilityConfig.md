# `readExtensibilityConfig()`

```ts
function readExtensibilityConfig(cwd: string): Promise<{}>;
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts:90](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts#L90)

Read the extensibility config file as-is, without validating it.

Supports multiple config file formats (see [resolveExtensibilityConfig](resolveExtensibilityConfig.md) for the list).
The config file must export a default export with the configuration object.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<\{
\}\>

The raw config object from the file

## Throws

If no config file is found or if the file doesn't export a default export
