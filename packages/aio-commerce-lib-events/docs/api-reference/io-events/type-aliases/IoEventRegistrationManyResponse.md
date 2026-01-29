# `IoEventRegistrationManyResponse`

```ts
type IoEventRegistrationManyResponse = CamelCasedPropertiesDeep<{
  _embedded: {
    registrations: IoEventRegistrationHalModel[];
  };
  _links: {
    self: HALLink;
  };
}>;
```

Defined in: [io-events/api/event-registrations/types.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/types.ts#L85)

Defines the fields of many I/O event registration entities returned by the Adobe I/O Events API (workspace-specific).
