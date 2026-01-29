# `IoEventRegistrationPaginatedResponse`

```ts
type IoEventRegistrationPaginatedResponse = CamelCasedPropertiesDeep<{
  _embedded: {
    registrations: IoEventRegistrationHalModel[];
  };
  _links: {
    first?: HALLink;
    last?: HALLink;
    next?: HALLink;
    prev?: HALLink;
    self: HALLink;
  };
  page: PageMetadata;
}>;
```

Defined in: [io-events/api/event-registrations/types.ts:95](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L95)

Defines the fields of paginated I/O event registration entities returned by the Adobe I/O Events API (consumer org-level).
