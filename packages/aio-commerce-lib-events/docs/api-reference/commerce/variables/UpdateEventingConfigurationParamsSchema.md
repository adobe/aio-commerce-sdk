# `UpdateEventingConfigurationParamsSchema`

```ts
const UpdateEventingConfigurationParamsSchema: Omit<
  ObjectSchema<
    {
      enabled: BooleanSchema<`Expected a boolean value for property '${string}'`>;
      environmentId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for property '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters and underscores are allowed for "${string}"`
          >,
        ]
      >;
      instanceId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for property '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters, underscores, and hyphens are allowed for property "${string}"`
          >,
        ]
      >;
      merchantId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for property '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters and underscores are allowed for "${string}"`
          >,
        ]
      >;
      providerId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for property '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters, underscores, and hyphens are allowed for property "${string}"`
          >,
        ]
      >;
      workspaceConfiguration: UnionSchema<
        [
          SchemaWithPipe<
            readonly [
              StringSchema<`Expected a string value for property '${string}'`>,
              EmptyAction<string, undefined>,
            ]
          >,
          SchemaWithPipe<
            readonly [
              StringSchema<`Expected a string value for property '${string}'`>,
              ParseJsonAction<
                string,
                undefined,
                `Expected valid JSON string for property '${string}'`
              >,
              RecordSchema<StringSchema<undefined>, UnknownSchema, undefined>,
              StringifyJsonAction<
                {
                  [key: string]: unknown;
                },
                undefined,
                undefined
              >,
            ]
          >,
          SchemaWithPipe<
            readonly [
              RecordSchema<StringSchema<undefined>, UnknownSchema, undefined>,
              StringifyJsonAction<
                {
                  [key: string]: unknown;
                },
                undefined,
                `Expected valid JSON data for property '${string}'`
              >,
            ]
          >,
        ],
        undefined
      >;
    },
    undefined
  >,
  "entries" | "~types" | "~run" | "~standard"
> & {};
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/eventing-configuration/schema.ts:11](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/eventing-configuration/schema.ts#L11)

The schema of the parameters received by the `updateConfiguration` Commerce Eventing API endpoint.
