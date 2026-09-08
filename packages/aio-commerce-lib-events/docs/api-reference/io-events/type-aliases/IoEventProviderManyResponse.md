# `IoEventProviderManyResponse`

```ts
type IoEventProviderManyResponse = {
  _embedded: {
    providers: IoEventProviderHalModel[];
  };
  _links: {
    self: HALLink;
  };
};
```

Defined in: [io-events/api/event-providers/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts#L44)

Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API.

## Properties

### \_embedded

```ts
_embedded: {
  providers: IoEventProviderHalModel[];
};
```

Defined in: [io-events/api/event-providers/types.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts#L45)

#### providers

```ts
providers: IoEventProviderHalModel[];
```

---

### \_links

```ts
_links: {
  self: HALLink;
}
```

Defined in: [io-events/api/event-providers/types.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-events/source/io-events/api/event-providers/types.ts#L48)

#### self

```ts
self: HALLink;
```
