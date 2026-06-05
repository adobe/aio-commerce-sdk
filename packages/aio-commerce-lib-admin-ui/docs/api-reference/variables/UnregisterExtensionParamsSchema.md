# `UnregisterExtensionParamsSchema`

```ts
const UnregisterExtensionParamsSchema: ObjectSchema<
  {
    extensionName: SchemaWithPipe<
      readonly [StringSchema<undefined>, MinLengthAction<string, 1, undefined>]
    >;
    workspaceName: SchemaWithPipe<
      readonly [StringSchema<undefined>, MinLengthAction<string, 1, undefined>]
    >;
  },
  undefined
>;
```

Defined in: [api/extensions/schema.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-admin-ui/source/api/extensions/schema.ts#L24)

Parameters for DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}.
