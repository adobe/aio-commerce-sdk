# `GridRequestSchema`

```ts
const GridRequestSchema: ObjectSchema<
  {
    gridType: PicklistSchema<
      readonly [
        "order",
        "product",
        "customer",
        "invoice",
        "creditmemo",
        "shipment",
        "newsletter",
      ],
      undefined
    >;
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

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/requests/schema.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/grid-columns/requests/schema.ts#L35)

Schema for the JSON body Commerce POSTs to a grid column handler.

Commerce sends one request per chunk of grid rows (currently up to 1000 IDs
per request). The upper bound is the Commerce side's contract and is not
enforced here.
