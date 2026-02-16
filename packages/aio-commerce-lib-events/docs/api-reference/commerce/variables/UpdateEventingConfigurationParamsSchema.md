# `UpdateEventingConfigurationParamsSchema`

```ts
const UpdateEventingConfigurationParamsSchema: Omit<
  ObjectSchema<
    {
      enabled: BooleanSchema<`Expected a boolean value for '${string}'`>;
      environmentId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters and underscores are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      instanceId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters, underscores, and hyphens are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      merchantId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters and underscores are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      providerId: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters, underscores, and hyphens are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      workspaceConfiguration: UnionSchema<
        [
          SchemaWithPipe<
            readonly [
              StringSchema<`Expected a string value for '${string}'`>,
              EmptyAction<string, undefined>,
            ]
          >,
          SchemaWithPipe<
            readonly [
              StringSchema<`Expected a string value for '${string}'`>,
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
  "~types" | "~run" | "~standard" | "entries"
> & {};
```

Defined in: [commerce/api/eventing-configuration/schema.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/eventing-configuration/schema.ts#L23)

The schema of the parameters received by the `updateConfiguration` Commerce Eventing API endpoint.
