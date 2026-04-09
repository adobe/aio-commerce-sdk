# `UpdateEventingConfigurationParamsSchema`

```ts
const UpdateEventingConfigurationParamsSchema: Omit<
  ObjectSchema<
    {
      enabled: BooleanSchema<`Expected a boolean value for '${string}'`>;
      environment_id: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters and underscores are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      instance_id: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters, underscores, and hyphens are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      merchant_id: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters and underscores are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      provider_id: SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<
            string,
            `Only alphanumeric characters, underscores, and hyphens are allowed in string value of "${string}"${string}`
          >,
        ]
      >;
      workspace_configuration: UnionSchema<
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

Defined in: [commerce/api/eventing-configuration/schema.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-events/source/commerce/api/eventing-configuration/schema.ts#L23)

The schema of the parameters received by the `updateConfiguration` Commerce Eventing API endpoint.
