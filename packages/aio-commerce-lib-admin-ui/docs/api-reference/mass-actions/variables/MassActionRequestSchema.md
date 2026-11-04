# `MassActionRequestSchema`

```ts
const MassActionRequestSchema: ObjectSchema<
  {
    gridType: PicklistSchema<
      readonly ["order", "product", "customer"],
      undefined
    >;
    requestId: SchemaWithPipe<
      readonly [
        StringSchema<`Expected a string value for '${string}'`>,
        NonEmptyAction<string, `The value of "${string}" must not be empty`>,
      ]
    >;
    selectedIds: SchemaWithPipe<
      readonly [
        ArraySchema<
          SchemaWithPipe<
            readonly [
              StringSchema<`Expected a string value for '${string}'`>,
              NonEmptyAction<
                string,
                `The value of "${string}" must not be empty`
              >,
            ]
          >,
          undefined
        >,
        MinLengthAction<
          string[],
          1,
          'The value of "selectedIds" must contain at least one entry'
        >,
      ]
    >;
  },
  undefined
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/worker/schema.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-admin-ui/source/mass-actions/worker/schema.ts#L31)

Schema for the JSON body Commerce POSTs to a worker mass action handler.

Commerce sends one request per chunk of selected IDs (currently up to 1000
IDs per request). The upper bound is the Commerce side's contract and is not
enforced here.
