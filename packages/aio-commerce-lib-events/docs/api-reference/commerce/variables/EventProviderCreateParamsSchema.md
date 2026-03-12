# `EventProviderCreateParamsSchema`

```ts
const EventProviderCreateParamsSchema: ObjectSchema<
  {
    description: OptionalSchema<
      StringSchema<`Expected a string value for '${string}'`>,
      undefined
    >;
    instance_id: StringSchema<`Expected a string value for '${string}'`>;
    label: OptionalSchema<
      StringSchema<`Expected a string value for '${string}'`>,
      undefined
    >;
    provider_id: StringSchema<`Expected a string value for '${string}'`>;
    workspace_configuration: OptionalSchema<
      UnionSchema<
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
      >,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [commerce/api/event-providers/schema.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-events/source/commerce/api/event-providers/schema.ts#L22)
