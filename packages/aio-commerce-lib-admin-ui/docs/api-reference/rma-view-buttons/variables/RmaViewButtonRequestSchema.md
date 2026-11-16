# `RmaViewButtonRequestSchema`

```ts
const RmaViewButtonRequestSchema: ObjectSchema<
  {
    id: SchemaWithPipe<
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
    rmaId: SchemaWithPipe<
      readonly [
        StringSchema<`Expected a string value for '${string}'`>,
        NonEmptyAction<string, `The value of "${string}" must not be empty`>,
      ]
    >;
  },
  undefined
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/rma-view-buttons/schema.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/rma-view-buttons/schema.ts#L21)

Schema for a return view-button worker request.
`id` identifies the clicked button; `rmaId` identifies the return being viewed.
All three fields must be non-empty strings.
