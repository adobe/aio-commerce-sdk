# `EventProviderCreateParamsSchema`

```ts
const EventProviderCreateParamsSchema: ObjectSchema<
  {
    associatedWorkspaceConfiguration: OptionalSchema<
      UnionSchema<
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
      >,
      undefined
    >;
    description: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
    instanceId: StringSchema<`Expected a string value for property '${string}'`>;
    label: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
    providerId: StringSchema<`Expected a string value for property '${string}'`>;
  },
  undefined
>;
```

Defined in: [commerce/api/event-providers/schema.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-providers/schema.ts#L22)
