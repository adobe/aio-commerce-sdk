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

Defined in: [io-events/api/event-registrations/schema.ts:154](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L154)

Schema for getting all registrations for a workspace.
