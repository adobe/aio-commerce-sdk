# `EventProviderUpdateParamsSchema`

```ts
const EventProviderUpdateParamsSchema: ObjectSchema<
  {
    consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
    description: OptionalSchema<
      StringSchema<`Expected a string value for '${string}'`>,
      undefined
    >;
    docsUrl: OptionalSchema<
      StringSchema<`Expected a string value for '${string}'`>,
      undefined
    >;
    label: StringSchema<`Expected a string value for '${string}'`>;
    projectId: StringSchema<`Expected a string value for '${string}'`>;
    providerId: StringSchema<`Expected a string value for '${string}'`>;
    workspaceId: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-providers/schema.ts:89](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L89)

The schema of the parameters received by the POST `providers` Adobe I/O Events API endpoint.

## See

https://developer.adobe.com/events/docs/api#operation/createProvider
