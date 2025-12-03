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

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts#L46)

Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API.
