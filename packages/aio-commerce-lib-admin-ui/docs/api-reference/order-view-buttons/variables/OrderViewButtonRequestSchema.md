# `OrderViewButtonRequestSchema`

```ts
const OrderViewButtonRequestSchema: ObjectSchema<
  {
    id: SchemaWithPipe<
      readonly [
        StringSchema<`Expected a string value for '${string}'`>,
        NonEmptyAction<string, `The value of "${string}" must not be empty`>,
      ]
    >;
    orderId: SchemaWithPipe<
      readonly [
        StringSchema<`Expected a string value for '${string}'`>,
        NonEmptyAction<string, `The value of "${string}" must not be empty`>,
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

Defined in: [aio-commerce-lib-admin-ui/source/order-view-buttons/schema.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/order-view-buttons/schema.ts#L23)

Schema for the JSON body Commerce POSTs to an order view button handler.

`id` identifies the specific button that was clicked, letting a single
handler serve multiple buttons by branching on it. `orderId` is the
single order currently being viewed.
