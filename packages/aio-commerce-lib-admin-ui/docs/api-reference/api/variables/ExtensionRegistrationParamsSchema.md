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

Defined in: [aio-commerce-lib-admin-ui/source/api/extensions/schema.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-admin-ui/source/api/extensions/schema.ts#L16)

Parameters for POST /V1/adminuisdk/extension.
