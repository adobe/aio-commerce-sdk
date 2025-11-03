# `readBundledSchemaWithVersion()`

```ts
function readBundledSchemaWithVersion(): Promise<{
  content: string;
  version: string;
}>;
```

Defined in: [modules/schema/schema-utils.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/modules/schema/schema-utils.ts#L39)

Read bundled schema file and return both content and calculated version

## Returns

`Promise`\<\{
`content`: `string`;
`version`: `string`;
\}\>
