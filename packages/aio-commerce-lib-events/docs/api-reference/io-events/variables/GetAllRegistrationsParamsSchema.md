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

Defined in: [io-events/api/event-registrations/schema.ts:154](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L154)

Schema for getting all registrations for a workspace.
