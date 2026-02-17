# `DeleteRegistrationParamsSchema`

```ts
const DeleteRegistrationParamsSchema: ObjectSchema<
  {
    consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
    projectId: StringSchema<`Expected a string value for '${string}'`>;
    registrationId: StringSchema<`Expected a string value for '${string}'`>;
    workspaceId: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:181](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L181)

Schema for deleting a registration.
