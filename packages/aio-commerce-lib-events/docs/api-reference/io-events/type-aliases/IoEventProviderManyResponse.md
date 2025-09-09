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

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts#L34)

Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API.
