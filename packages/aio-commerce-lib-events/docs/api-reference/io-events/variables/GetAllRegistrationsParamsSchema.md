# `GetAllRegistrationsParamsSchema`

```ts
const GetAllRegistrationsParamsSchema: ObjectSchema<
  {
    consumerOrgId: StringSchema<`Expected a string value for property '${string}'`>;
    projectId: StringSchema<`Expected a string value for property '${string}'`>;
    workspaceId: StringSchema<`Expected a string value for property '${string}'`>;
  },
  undefined
> = WorkspacePathParamsSchema;
```

Defined in: [io-events/api/event-registrations/schema.ts:155](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L155)

Schema for getting all registrations for a workspace.
