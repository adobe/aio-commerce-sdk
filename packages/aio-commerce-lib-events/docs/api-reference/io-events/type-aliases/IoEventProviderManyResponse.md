# `IoEventProviderManyResponse`

```ts
type IoEventProviderManyResponse = CamelCasedPropertiesDeep<{
  _embedded: {
    providers: IoEventProviderHalModel[];
  };
  _links: {
    self: HALLink;
  };
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts#L46)

Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API.
