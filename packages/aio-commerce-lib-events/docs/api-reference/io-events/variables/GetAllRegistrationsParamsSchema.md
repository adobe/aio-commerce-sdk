# `GetAllRegistrationsParamsSchema`

```ts
const GetAllRegistrationsParamsSchema: ObjectSchema<
  {
    consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
    projectId: StringSchema<`Expected a string value for '${string}'`>;
    workspaceId: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
> = WorkspacePathParamsSchema;
```

Defined in: [io-events/api/event-registrations/schema.ts:154](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L154)

Schema for getting all registrations for a workspace.
