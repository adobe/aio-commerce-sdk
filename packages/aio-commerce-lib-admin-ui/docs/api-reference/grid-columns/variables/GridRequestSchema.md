# `GridRequestSchema`

```ts
const GridRequestSchema: ObjectSchema<
  {
    gridType: PicklistSchema<["order", "product", "customer"], undefined>;
    ids: SchemaWithPipe<
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
          'The value of "ids" must contain at least one entry'
        >,
      ]
    >;
    requestId: SchemaWithPipe<
      readonly [
        StringSchema<`Expected a string value for '${string}'`>,
        NonEmptyAction<string, `The value of "${string}" must not be empty`>,
      ]
    >;
  },
  undefined
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/requests/schema.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-admin-ui/source/grid-columns/requests/schema.ts#L30)

Schema for the JSON body Commerce POSTs to a grid column handler.

Commerce sends one request per chunk of grid rows (currently up to 1000 IDs
per request). The upper bound is the Commerce side's contract and is not
enforced here.
