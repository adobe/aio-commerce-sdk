# `ExtensionRegistrationParamsSchema`

```ts
const ExtensionRegistrationParamsSchema: ObjectSchema<
  {
    extensionName: SchemaWithPipe<
      readonly [StringSchema<undefined>, MinLengthAction<string, 1, undefined>]
    >;
    extensionTitle: SchemaWithPipe<
      readonly [StringSchema<undefined>, MinLengthAction<string, 1, undefined>]
    >;
    extensionWorkspace: SchemaWithPipe<
      readonly [StringSchema<undefined>, MinLengthAction<string, 1, undefined>]
    >;
  },
  undefined
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/extensions/schema.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-admin-ui/source/api/extensions/schema.ts#L16)

Parameters for POST /V1/adminuisdk/extension.
